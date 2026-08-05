// ============================================================
// Borrow Transaction & Reservation Service
// Enhanced with:
// - Max 3 books for STUDENT, configured limit for FACULTY
// - Period selection (7/14/30 days) for FACULTY
// - QR code generation on approval
// - Return with QR verification
// - Reservation queue management
// - Overdue checks and fine calculations
// ============================================================

import { prisma } from '../config';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination';
import { generateQRCode } from '../utils/qrcode';
import { policyService } from './policy.service';
import { Role } from '@prisma/client';

export class TransactionService {
  // ============================================================
  // Borrow Requests
  // ============================================================

  /**
   * Create a borrow request
   * - STUDENT: max 3 active books
   * - FACULTY: uses FACULTY_MAX_BOOKS policy (default 10)
   * - LIBRARIAN: no limit
   */
  async createBorrowRequest(userId: string, bookId: string, notes?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundError('Book');

    if (!user.isActive) {
      throw new BadRequestError('Your account is deactivated. Contact a librarian.');
    }

    if (book.status === 'LOST') {
      throw new BadRequestError('This book is marked as lost and cannot be borrowed');
    }

    if (book.status === 'MAINTENANCE') {
      throw new BadRequestError('This book is under maintenance');
    }

    if (book.availableCopies < 1) {
      throw new BadRequestError('No copies currently available. You can reserve it instead.');
    }

    // Check existing pending/active request for same book
    const existingRequest = await prisma.borrowRequest.findFirst({
      where: {
        userId,
        bookId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });
    if (existingRequest) {
      throw new ConflictError('You already have a pending or approved request for this book');
    }

    // Check existing active transaction for same book
    const existingActive = await prisma.borrowTransaction.findFirst({
      where: { userId, bookId, status: 'ACTIVE' },
    });
    if (existingActive) {
      throw new ConflictError('You already have this book borrowed');
    }

    // Enforce max books limit based on role
    const activeCount = await prisma.borrowTransaction.count({
      where: { userId, status: 'ACTIVE' },
    });

    let maxBooks: number;
    if (user.role === Role.STUDENT) {
      maxBooks = user.maxBooksAllowed ?? (await policyService.getNumber('MAX_BOOKS_PER_USER', 3));
    } else if (user.role === Role.FACULTY) {
      maxBooks = user.maxBooksAllowed ?? (await policyService.getNumber('FACULTY_MAX_BOOKS', 10));
    } else {
      maxBooks = 999; // Librarians have no practical limit
    }

    if (activeCount >= maxBooks) {
      throw new BadRequestError(
        `You have reached the maximum limit of ${maxBooks} active borrows. Return a book first.`
      );
    }

    const request = await prisma.borrowRequest.create({
      data: { userId, bookId, notes },
      include: {
        book: { select: { title: true, author: true, accessionNo: true, isbn: true } },
        user: { select: { firstName: true, lastName: true, libraryId: true, role: true } },
      },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'BORROW_REQUEST',
        entity: 'BorrowRequest',
        entityId: request.id,
        details: { bookTitle: book.title, bookId },
      },
    });

    return request;
  }

  /**
   * Approve a borrow request (librarian only)
   * - Generates QR code for the transaction
   * - FACULTY can select borrow period (7, 14, 30 days)
   * - Handles reservation queue fulfillment
   */
  async approveRequest(requestId: string, librarianId: string, dueDateOverride?: Date) {
    const request = await prisma.borrowRequest.findUnique({
      where: { id: requestId },
      include: {
        book: true,
        user: true,
      },
    });
    if (!request) throw new NotFoundError('Borrow request');
    if (request.status !== 'PENDING') {
      throw new BadRequestError('Request has already been processed');
    }
    if (request.book.availableCopies < 1) {
      throw new BadRequestError('No copies available for this book');
    }

    // Calculate due date
    let dueDate: Date;
    if (dueDateOverride) {
      dueDate = dueDateOverride;
    } else if (request.user.role === Role.FACULTY) {
      // Faculty: use FACULTY_MAX_BORROW_DAYS policy
      const facultyDays = request.user.maxBorrowDays ?? (await policyService.getNumber('FACULTY_MAX_BORROW_DAYS', 30));
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + facultyDays);
    } else {
      // Student: use MAX_BORROW_DAYS policy
      const maxDays = request.user.maxBorrowDays ?? (await policyService.getNumber('MAX_BORROW_DAYS', 14));
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + maxDays);
    }

    // Generate QR code payload
    const qrPayload = {
      txnId: `TXN-${Date.now()}`,
      accessionNo: request.book.accessionNo,
      userId: request.userId,
      issuedAt: new Date().toISOString(),
    };
    const qrCodeDataUrl = await generateQRCode(qrPayload);

    // Execute transactional updates
    const [transaction] = await prisma.$transaction([
      prisma.borrowTransaction.create({
        data: {
          userId: request.userId,
          bookId: request.bookId,
          dueDate,
          status: 'ACTIVE',
          notes: request.notes || undefined,
          qrCode: qrCodeDataUrl,
        },
        include: {
          book: { select: { title: true, accessionNo: true, isbn: true, shelf: true, row: true } },
          user: { select: { id: true, firstName: true, lastName: true, libraryId: true, role: true } },
        },
      }),
      prisma.borrowRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', processedById: librarianId, processedAt: new Date() },
      }),
      prisma.book.update({
        where: { id: request.bookId },
        data: {
          availableCopies: { decrement: 1 },
          status: request.book.availableCopies - 1 <= 0 ? 'BORROWED' : 'AVAILABLE',
        },
      }),
      prisma.notification.create({
        data: {
          userId: request.userId,
          type: 'REQUEST_APPROVED',
          title: 'Borrow Request Approved',
          message: `Your request to borrow "${request.book.title}" has been approved. Due date: ${dueDate.toLocaleDateString()}. Show the QR code when picking up.`,
          link: `/transactions`, // Will be replaced with actual ID after creation
        },
      }),
      prisma.activityLog.create({
        data: {
          userId: librarianId,
          action: 'APPROVE_REQUEST',
          entity: 'BorrowRequest',
          entityId: requestId,
          details: { bookTitle: request.book.title, userId: request.userId, dueDate },
        },
      }),
    ]);

    // If this book was reserved, mark the first active reservation as fulfilled
    const activeReservation = await prisma.reservation.findFirst({
      where: { bookId: request.bookId, status: 'ACTIVE', userId: request.userId },
    });
    if (activeReservation) {
      await prisma.reservation.update({
        where: { id: activeReservation.id },
        data: { status: 'FULFILLED', notified: true },
      });
    }

    // Recalculate queue positions for remaining reservations
    const remainingReservations = await prisma.reservation.findMany({
      where: { bookId: request.bookId, status: 'ACTIVE' },
      orderBy: { queuePosition: 'asc' },
    });
    for (let i = 0; i < remainingReservations.length; i++) {
      await prisma.reservation.update({
        where: { id: remainingReservations[i].id },
        data: { queuePosition: i + 1 },
      });
    }

    return { ...transaction, qrCode: qrCodeDataUrl };
  }

  /**
   * Reject a borrow request (with reason)
   */
  async rejectRequest(requestId: string, librarianId: string, reason: string) {
    const request = await prisma.borrowRequest.findUnique({
      where: { id: requestId },
      include: { book: true },
    });
    if (!request) throw new NotFoundError('Borrow request');
    if (request.status !== 'PENDING') throw new BadRequestError('Request already processed');

    await prisma.$transaction([
      prisma.borrowRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED', processedById: librarianId, processedAt: new Date(), notes: reason },
      }),
      prisma.notification.create({
        data: {
          userId: request.userId,
          type: 'REQUEST_REJECTED',
          title: 'Borrow Request Rejected',
          message: `Your request to borrow "${request.book.title}" was rejected. Reason: ${reason}`,
          link: `/requests/${requestId}`,
        },
      }),
      prisma.activityLog.create({
        data: {
          userId: librarianId,
          action: 'REJECT_REQUEST',
          entity: 'BorrowRequest',
          entityId: requestId,
          details: { bookTitle: request.book.title, reason },
        },
      }),
    ]);
  }

  /**
   * List borrow requests (with filters)
   */
  async listBorrowRequests(query: Record<string, unknown>, userId?: string) {
    const { page, limit, skip, take } = getPaginationParams(query);
    const where: any = {};
    if (userId) where.userId = userId;
    if (query.status) where.status = query.status;

    const [requests, total] = await Promise.all([
      prisma.borrowRequest.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, libraryId: true, role: true } },
          book: { select: { id: true, title: true, author: true, accessionNo: true, isbn: true } },
          processedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { requestDate: 'desc' },
        skip,
        take,
      }),
      prisma.borrowRequest.count({ where }),
    ]);

    return { requests, meta: buildPaginationMeta(total, { page, limit, skip, take }) };
  }

  // ============================================================
  // Borrow Transactions
  // ============================================================

  /**
   * Return a borrowed book
   * - Accepts transaction ID or QR code
   * - Calculates overdue fines
   * - Updates book availability
   * - Notifies next in reservation queue
   */
  async returnBook(transactionIdOrQr: string) {
    let transaction;

    // First, try to find by ID
    transaction = await prisma.borrowTransaction.findUnique({
      where: { id: transactionIdOrQr },
      include: { book: true, user: { select: { id: true, firstName: true, lastName: true } } },
    });

    // If not found by ID, try QR scan - decode and find by accessionNo
    if (!transaction) {
      try {
        const decoded = JSON.parse(transactionIdOrQr);
        if (decoded.accessionNo) {
          transaction = await prisma.borrowTransaction.findFirst({
            where: {
              book: { accessionNo: decoded.accessionNo },
              status: { in: ['ACTIVE', 'OVERDUE'] },
              returnDate: null,
            },
            include: { book: true, user: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { borrowDate: 'desc' },
          });
        }
      } catch {
        // Not a QR payload either — try to find by accessionNo directly
        transaction = await prisma.borrowTransaction.findFirst({
          where: {
            book: { accessionNo: transactionIdOrQr },
            status: 'ACTIVE',
          },
          include: { book: true, user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { borrowDate: 'desc' },
        });
      }
    }

    if (!transaction) throw new NotFoundError('Active transaction for this book');
    if (transaction.returnDate) throw new BadRequestError('Book already returned');

    const now = new Date();
    const isOverdue = now > transaction.dueDate;

    // Calculate fine
    let fineAmount = 0;
    if (isOverdue) {
      const finePerDay = await policyService.getFloat('FINE_PER_DAY', 10);
      const diffDays = Math.ceil((now.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      fineAmount = diffDays * finePerDay;
    }

    const [updated] = await prisma.$transaction([
      prisma.borrowTransaction.update({
        where: { id: transaction.id },
        data: {
          returnDate: now,
          status: isOverdue ? 'OVERDUE' : 'RETURNED',
          fineAmount,
          qrScanned: true,
        },
        include: {
          book: { select: { title: true, accessionNo: true, isbn: true } },
          user: { select: { id: true, firstName: true, lastName: true, libraryId: true } },
        },
      }),
      prisma.book.update({
        where: { id: transaction.bookId },
        data: { availableCopies: { increment: 1 }, status: 'AVAILABLE' },
      }),
      prisma.activityLog.create({
        data: {
          userId: transaction.userId,
          action: 'RETURN_BOOK',
          entity: 'BorrowTransaction',
          entityId: transaction.id,
          details: {
            bookTitle: transaction.book.title,
            accessionNo: transaction.book.accessionNo,
            isOverdue,
            fineAmount,
          },
        },
      }),
    ]);

    // If there's a fine, notify the user
    if (fineAmount > 0) {
      await prisma.notification.create({
        data: {
          userId: transaction.userId,
          type: 'OVERDUE_FINE',
          title: 'Overdue Fine Incurred',
          message: `Your borrowed book "${transaction.book.title}" was returned ${Math.ceil((now.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24))} days late. Fine: ₱${fineAmount.toFixed(2)}.`,
          link: `/transactions/${transaction.id}`,
        },
      });
    }

    // Check and notify next reservation in queue
    const nextReservation = await prisma.reservation.findFirst({
      where: { bookId: transaction.bookId, status: 'ACTIVE' },
      orderBy: { queuePosition: 'asc' },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (nextReservation) {
      await prisma.notification.create({
        data: {
          userId: nextReservation.userId,
          type: 'RESERVATION_AVAILABLE',
          title: 'Reserved Book Now Available',
          message: `"${updated.book.title}" you reserved is now available. Please pick it up within ${await policyService.getNumber('MAX_RESERVATION_DAYS', 3)} days.`,
          link: `/reservations/${nextReservation.id}`,
        },
      });
    }

    return updated;
  }

  /**
   * List transactions with filters
   */
async listTransactions(query: Record<string, unknown>, userId?: string) {
    const { page, limit, skip, take } = getPaginationParams(query);
    const where: any = {};
    if (userId) where.userId = userId;
    if (query.status) where.status = query.status;

    // Search by book title/accession no OR member name/library id
    if (query.search) {
      const s = query.search as string;
      where.OR = [
        { book: { title: { contains: s, mode: 'insensitive' } } },
        { book: { accessionNo: { contains: s, mode: 'insensitive' } } },
        { book: { author: { contains: s, mode: 'insensitive' } } },
        { user: { firstName: { contains: s, mode: 'insensitive' } } },
        { user: { lastName: { contains: s, mode: 'insensitive' } } },
        { user: { libraryId: { contains: s, mode: 'insensitive' } } },
      ];
    }

    // Filter by date range
    if (query.fromDate) {
      where.borrowDate = { ...(where.borrowDate || {}), gte: new Date(query.fromDate as string) };
    }
    if (query.toDate) {
      where.borrowDate = { ...(where.borrowDate || {}), lte: new Date(query.toDate as string) };
    }

    const [transactions, total] = await Promise.all([
      prisma.borrowTransaction.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, libraryId: true, role: true } },
          book: { select: { id: true, title: true, author: true, accessionNo: true, isbn: true } },
        },
        orderBy: { borrowDate: 'desc' },
        skip,
        take,
      }),
      prisma.borrowTransaction.count({ where }),
    ]);

    return { transactions, meta: buildPaginationMeta(total, { page, limit, skip, take }) };
  }

  /**
   * Get single transaction details
   */
  async getTransaction(transactionId: string) {
    const transaction = await prisma.borrowTransaction.findUnique({
      where: { id: transactionId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, libraryId: true, role: true } },
        book: { select: { id: true, title: true, author: true, accessionNo: true, isbn: true, publisher: true, shelf: true, row: true } },
      },
    });
    if (!transaction) throw new NotFoundError('Transaction');
    return transaction;
  }

  /**
   * Pay fine for an overdue/returned transaction
   */
  async payFine(transactionId: string, amount: number) {
    const transaction = await prisma.borrowTransaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) throw new NotFoundError('Transaction');
    if (transaction.finePaid) throw new BadRequestError('Fine already paid');
    if (!transaction.fineAmount || transaction.fineAmount <= 0) {
      throw new BadRequestError('No fine to pay');
    }

    if (amount < transaction.fineAmount) {
      throw new BadRequestError(
        `Insufficient payment. Required: ₱${transaction.fineAmount.toFixed(2)}, provided: ₱${amount.toFixed(2)}`
      );
    }

    const updated = await prisma.borrowTransaction.update({
      where: { id: transactionId },
      data: { finePaid: true },
      include: {
        book: { select: { title: true, accessionNo: true } },
        user: { select: { firstName: true, lastName: true, libraryId: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId: transaction.userId,
        type: 'SYSTEM',
        title: 'Fine Paid',
        message: `Your fine of ₱${transaction.fineAmount.toFixed(2)} for "${updated.book.title}" has been paid.`,
        link: `/transactions/${transactionId}`,
      },
    });

    return updated;
  }

  /**
   * Get active transaction count for a user (for validation)
   */
  async getUserActiveCount(userId: string): Promise<number> {
    return prisma.borrowTransaction.count({
      where: { userId, status: 'ACTIVE' },
    });
  }

  // ============================================================
  // Reservations
  // ============================================================

  /**
   * Reserve a book
   * - Only for books that are currently unavailable
   * - Respects queue limit
   * - Auto-positions in queue
   */
  async reserveBook(userId: string, bookId: string) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundError('Book');

    // Allow reservation even if available (for future-borrow planning)
    // But warn via notification

    const existing = await prisma.reservation.findFirst({
      where: { userId, bookId, status: 'ACTIVE' },
    });
    if (existing) throw new ConflictError('You already have an active reservation for this book');

    // Check if already borrowed
    const activeBorrow = await prisma.borrowTransaction.findFirst({
      where: { userId, bookId, status: 'ACTIVE' },
    });
    if (activeBorrow) throw new ConflictError('You already have this book borrowed');

    // Check queue limit
    const queueLimit = await policyService.getNumber('RESERVATION_QUEUE_LIMIT', 10);
    const activeReservations = await prisma.reservation.count({
      where: { bookId, status: 'ACTIVE' },
    });
    if (activeReservations >= queueLimit) {
      throw new BadRequestError(`Reservation queue is full (max ${queueLimit}) for this book`);
    }

    // Get expiry days
    const maxExpiryDays = await policyService.getNumber('MAX_RESERVATION_DAYS', 3);

    const reservation = await prisma.reservation.create({
      data: {
        userId,
        bookId,
        expiryDate: new Date(Date.now() + maxExpiryDays * 24 * 60 * 60 * 1000),
        queuePosition: activeReservations + 1,
      },
      include: {
        book: { select: { title: true, author: true, accessionNo: true, isbn: true } },
        user: { select: { firstName: true, lastName: true, libraryId: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'RESERVE_BOOK',
        entity: 'Reservation',
        entityId: reservation.id,
        details: { bookTitle: book.title, queuePosition: reservation.queuePosition },
      },
    });

    return reservation;
  }

  /**
   * Cancel a reservation
   * - Recalculates queue positions
   */
  async cancelReservation(reservationId: string, userId: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { book: { select: { title: true } } },
    });
    if (!reservation) throw new NotFoundError('Reservation');
    if (reservation.userId !== userId) throw new BadRequestError('Not your reservation');
    if (reservation.status !== 'ACTIVE') throw new BadRequestError('Reservation already processed');

    await prisma.$transaction([
      prisma.reservation.update({
        where: { id: reservationId },
        data: { status: 'CANCELLED' },
      }),
      prisma.activityLog.create({
        data: {
          userId,
          action: 'CANCEL_RESERVATION',
          entity: 'Reservation',
          entityId: reservationId,
          details: { bookTitle: reservation.book.title },
        },
      }),
    ]);

    // Recalculate positions for remaining reservations of this book
    const remaining = await prisma.reservation.findMany({
      where: { bookId: reservation.bookId, status: 'ACTIVE' },
      orderBy: { queuePosition: 'asc' },
    });
    for (let i = 0; i < remaining.length; i++) {
      await prisma.reservation.update({
        where: { id: remaining[i].id },
        data: { queuePosition: i + 1 },
      });
    }
  }

  /**
   * List reservations for a user or all (librarian)
   */
  async listReservations(query: Record<string, unknown>, userId?: string) {
    const { page, limit, skip, take } = getPaginationParams(query);
    const where: any = {};
    if (userId) where.userId = userId;
    if (query.status) where.status = query.status;
    if (query.bookId) where.bookId = query.bookId;

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, libraryId: true } },
          book: { select: { id: true, title: true, author: true, accessionNo: true, isbn: true, availableCopies: true, status: true } },
        },
        orderBy: [{ queuePosition: 'asc' }, { reservationDate: 'desc' }],
        skip,
        take,
      }),
      prisma.reservation.count({ where }),
    ]);

    return { reservations, meta: buildPaginationMeta(total, { page, limit, skip, take }) };
  }

  /**
   * Run overdue check — mark transactions as OVERDUE if past due date
   * Called by a cron job or on-demand
   */
  async checkOverdueTransactions() {
    const now = new Date();
    const overdueTransactions = await prisma.borrowTransaction.findMany({
      where: {
        status: 'ACTIVE',
        dueDate: { lt: now },
      },
      include: {
        book: { select: { title: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    for (const txn of overdueTransactions) {
      const diffDays = Math.ceil((now.getTime() - txn.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const finePerDay = await policyService.getFloat('FINE_PER_DAY', 10);
      const fine = diffDays * finePerDay;

      await prisma.$transaction([
        prisma.borrowTransaction.update({
          where: { id: txn.id },
          data: { status: 'OVERDUE', fineAmount: fine },
        }),
        prisma.notification.create({
          data: {
            userId: txn.userId,
            type: 'OVERDUE_FINE',
            title: 'Book Overdue',
            message: `"${txn.book.title}" is ${diffDays} day(s) overdue. Fine: ₱${fine.toFixed(2)}. Please return immediately.`,
            link: `/transactions/${txn.id}`,
          },
        }),
      ]);
    }

    return { processed: overdueTransactions.length };
  }
}

export const transactionService = new TransactionService();

