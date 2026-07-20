// ============================================================
// Borrow Transaction & Reservation Service
// ============================================================

import { prisma } from '../config';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination';

export class TransactionService {
  // ============================================================
  // Borrow Requests
  // ============================================================

  /**
   * Create a borrow request
   */
  async createBorrowRequest(userId: string, bookId: string, notes?: string) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundError('Book');

    if (book.availableCopies < 1) {
      throw new BadRequestError('No copies available for borrowing');
    }

    // Check for existing pending request
    const existingRequest = await prisma.borrowRequest.findFirst({
      where: { userId, bookId, status: 'PENDING' },
    });
    if (existingRequest) {
      throw new ConflictError('You already have a pending request for this book');
    }

    const request = await prisma.borrowRequest.create({
      data: { userId, bookId, notes },
      include: {
        book: { select: { title: true, author: true, accessionNo: true } },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'BORROW_CONFIRMATION',
        title: 'Borrow Request Submitted',
        message: `Your request for "${book.title}" has been submitted and is pending approval.`,
        link: `/requests/${request.id}`,
      },
    });

    return request;
  }

  /**
   * Approve a borrow request (librarian only)
   */
  async approveRequest(requestId: string, librarianId: string) {
    const request = await prisma.borrowRequest.findUnique({
      where: { id: requestId },
      include: { book: true },
    });
    if (!request) throw new NotFoundError('Borrow request');

    if (request.status !== 'PENDING') {
      throw new BadRequestError('Request has already been processed');
    }

    // Check available copies
    if (request.book.availableCopies < 1) {
      throw new BadRequestError('No copies available');
    }

    // Calculate due date (use policy or default)
    const policy = await prisma.policy.findUnique({ where: { key: 'MAX_BORROW_DAYS' } });
    const maxDays = parseInt(policy?.value || '14', 10);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + maxDays);

    // Update request and create transaction in a transaction
    const [transaction] = await prisma.$transaction([
      prisma.borrowTransaction.create({
        data: {
          userId: request.userId,
          bookId: request.bookId,
          dueDate,
          status: 'ACTIVE',
          notes: request.notes || undefined,
        },
        include: {
          book: { select: { title: true, accessionNo: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.borrowRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          processedById: librarianId,
          processedAt: new Date(),
        },
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
          message: `Your request to borrow "${request.book.title}" has been approved. Due date: ${dueDate.toLocaleDateString()}.`,
          link: `/transactions/${request.id}`,
        },
      }),
    ]);

    return transaction;
  }

  /**
   * Reject a borrow request
   */
  async rejectRequest(requestId: string, librarianId: string, reason?: string) {
    const request = await prisma.borrowRequest.findUnique({
      where: { id: requestId },
      include: { book: true },
    });
    if (!request) throw new NotFoundError('Borrow request');
    if (request.status !== 'PENDING') throw new BadRequestError('Request already processed');

    await prisma.$transaction([
      prisma.borrowRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          processedById: librarianId,
          processedAt: new Date(),
          notes: reason || request.notes,
        },
      }),
      prisma.notification.create({
        data: {
          userId: request.userId,
          type: 'REQUEST_REJECTED',
          title: 'Borrow Request Rejected',
          message: reason
            ? `Your request to borrow "${request.book.title}" was rejected: ${reason}`
            : `Your request to borrow "${request.book.title}" was rejected.`,
          link: `/requests/${requestId}`,
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
          user: { select: { id: true, firstName: true, lastName: true, libraryId: true } },
          book: { select: { id: true, title: true, author: true, accessionNo: true } },
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
   */
  async returnBook(transactionId: string) {
    const transaction = await prisma.borrowTransaction.findUnique({
      where: { id: transactionId },
      include: { book: true },
    });
    if (!transaction) throw new NotFoundError('Transaction');
    if (transaction.status !== 'ACTIVE') throw new BadRequestError('Book already returned');

    const now = new Date();
    const isOverdue = now > transaction.dueDate;

    // Calculate fine
    let fineAmount = 0;
    if (isOverdue) {
      const policy = await prisma.policy.findUnique({ where: { key: 'FINE_PER_DAY' } });
      const finePerDay = parseFloat(policy?.value || '10');
      const diffDays = Math.ceil((now.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      fineAmount = diffDays * finePerDay;
    }

    const [updated] = await prisma.$transaction([
      prisma.borrowTransaction.update({
        where: { id: transactionId },
        data: {
          returnDate: now,
          status: isOverdue ? 'OVERDUE' : 'RETURNED',
          fineAmount,
          finePaid: false,
        },
        include: {
          book: { select: { title: true, accessionNo: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.book.update({
        where: { id: transaction.bookId },
        data: {
          availableCopies: { increment: 1 },
          status: 'AVAILABLE',
        },
      }),
    ]);

    // Check and notify next reservation in queue
    const nextReservation = await prisma.reservation.findFirst({
      where: { bookId: transaction.bookId, status: 'ACTIVE' },
      orderBy: { queuePosition: 'asc' },
    });

    if (nextReservation) {
      await prisma.notification.create({
        data: {
          userId: nextReservation.userId,
          type: 'RESERVATION_AVAILABLE',
          title: 'Reserved Book Available',
          message: `"${updated.book.title}" is now available. You have 3 days to borrow it.`,
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

    const [transactions, total] = await Promise.all([
      prisma.borrowTransaction.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, libraryId: true } },
          book: { select: { id: true, title: true, author: true, accessionNo: true } },
        },
        orderBy: { borrowDate: 'desc' },
        skip,
        take,
      }),
      prisma.borrowTransaction.count({ where }),
    ]);

    return {
      transactions,
      meta: buildPaginationMeta(total, { page, limit, skip, take }),
    };
  }

  // ============================================================
  // Reservations
  // ============================================================

  /**
   * Reserve a book
   */
  async reserveBook(userId: string, bookId: string) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundError('Book');

    // Check if user already has active reservation for this book
    const existing = await prisma.reservation.findFirst({
      where: { userId, bookId, status: 'ACTIVE' },
    });
    if (existing) throw new ConflictError('You already have an active reservation for this book');

    // Check max reservation queue length
    const policy = await prisma.policy.findUnique({ where: { key: 'RESERVATION_QUEUE_LIMIT' } });
    const queueLimit = parseInt(policy?.value || '10', 10);
    const activeReservations = await prisma.reservation.count({
      where: { bookId, status: 'ACTIVE' },
    });
    if (activeReservations >= queueLimit) {
      throw new BadRequestError('Reservation queue is full for this book');
    }

    // Get max expiry days
    const expiryPolicy = await prisma.policy.findUnique({ where: { key: 'MAX_RESERVATION_DAYS' } });
    const maxExpiryDays = parseInt(expiryPolicy?.value || '3', 10);

    const reservation = await prisma.reservation.create({
      data: {
        userId,
        bookId,
        expiryDate: new Date(Date.now() + maxExpiryDays * 24 * 60 * 60 * 1000),
        queuePosition: activeReservations + 1,
      },
      include: {
        book: { select: { title: true, author: true } },
      },
    });

    return reservation;
  }

  /**
   * Cancel a reservation
   */
  async cancelReservation(reservationId: string, userId: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw new NotFoundError('Reservation');
    if (reservation.userId !== userId) throw new BadRequestError('Not your reservation');
    if (reservation.status !== 'ACTIVE') throw new BadRequestError('Reservation already processed');

    await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED' },
    });
  }
}

export const transactionService = new TransactionService();

