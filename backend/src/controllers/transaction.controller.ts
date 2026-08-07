// ============================================================
// Borrow Transaction & Reservation Controller
// ============================================================

import { Request, Response } from 'express';
import { transactionService } from '../services';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';

// ============================================================
// Borrow Requests
// ============================================================

export const createBorrowRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookIds, bookId, notes } = req.body;
    // Accept either a single bookId (backward compatible) or an array of bookIds
    const normalizedBookIds: string[] = Array.isArray(bookIds)
      ? bookIds
      : bookId
        ? [bookId]
        : [];
    const request = await transactionService.createBorrowRequest({
      userId: req.user!.userId,
      bookIds: normalizedBookIds,
      notes,
    });
    sendSuccess(res, request, 'Borrow request submitted', 201);
  }
);

export const listBorrowRequests = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId =
      req.user!.role === 'LIBRARIAN' ? undefined : req.user!.userId;
    const { requests, meta } = await transactionService.listBorrowRequests(
      req.query as Record<string, unknown>,
      userId
    );
    sendSuccess(res, requests, undefined, 200, meta);
  }
);

export const approveRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const dueDateOverride = req.body.dueDate ? new Date(req.body.dueDate) : undefined;
    const result = await transactionService.approveRequest(
      req.params.id,
      req.user!.userId,
      dueDateOverride
    );
    sendSuccess(res, result, 'Borrow request approved');
  }
);

export const rejectRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { reason } = req.body;
    if (!reason) {
      res.status(400).json({ success: false, error: 'Rejection reason is required' });
      return;
    }
    await transactionService.rejectRequest(req.params.id, req.user!.userId, reason);
    sendSuccess(res, null, 'Borrow request rejected');
  }
);

// ============================================================
// Borrow Transactions
// ============================================================

export const listTransactions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId =
      req.user!.role === 'LIBRARIAN' ? undefined : req.user!.userId;
    const { transactions, meta } = await transactionService.listTransactions(
      req.query as Record<string, unknown>,
      userId
    );
    sendSuccess(res, transactions, undefined, 200, meta);
  }
);

export const getTransaction = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const transaction = await transactionService.getTransaction(req.params.id);
    sendSuccess(res, transaction);
  }
);

export const returnBook = asyncHandler(async (req: Request, res: Response) => {
  const { qrCode } = req.body;
  const identifier = qrCode || req.params.id;
  const transaction = await transactionService.returnBook(identifier);
  sendSuccess(res, transaction, 'Book returned successfully');
});

export const declareMissing = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { reason } = req.body;
    const transaction = await transactionService.declareMissing(
      req.params.id,
      req.user!.userId,
      reason
    );
    sendSuccess(res, transaction, 'Book declared missing');
  }
);

export const payFine = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { amount } = req.body;
    const transaction = await transactionService.payFine(req.params.id, amount);
    sendSuccess(res, transaction, 'Fine paid successfully');
  }
);

export const checkOverdue = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await transactionService.checkOverdueTransactions();
    sendSuccess(res, result, 'Overdue check completed');
  }
);

// ============================================================
// Reservations
// ============================================================

export const reserveBook = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookId } = req.body;
    const reservation = await transactionService.reserveBook(
      req.user!.userId,
      bookId
    );
    sendSuccess(res, reservation, 'Book reserved successfully', 201);
  }
);

export const cancelReservation = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await transactionService.cancelReservation(req.params.id, req.user!.userId);
    sendSuccess(res, null, 'Reservation cancelled');
  }
);

export const listReservations = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId =
      req.user!.role === 'LIBRARIAN' ? undefined : req.user!.userId;
    const { reservations, meta } = await transactionService.listReservations(
      req.query as Record<string, unknown>,
      userId
    );
    sendSuccess(res, reservations, undefined, 200, meta);
  }
);

export const getMyActiveCount = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const count = await transactionService.getUserActiveCount(req.user!.userId);
    sendSuccess(res, { activeCount: count });
  }
);
