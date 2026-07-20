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

/**
 * POST /api/requests
 */
export const createBorrowRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookId, notes } = req.body;
    const request = await transactionService.createBorrowRequest(
      req.user!.userId,
      bookId,
      notes
    );
    sendSuccess(res, request, 'Borrow request submitted', 201);
  }
);

/**
 * GET /api/requests
 */
export const listBorrowRequests = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    // Students/faculty see only their own requests; librarians see all
    const userId =
      req.user!.role === 'LIBRARIAN'
        ? undefined
        : req.user!.userId;
    const { requests, meta } = await transactionService.listBorrowRequests(
      req.query as Record<string, unknown>,
      userId
    );
    sendSuccess(res, requests, undefined, 200, meta);
  }
);

/**
 * PUT /api/requests/:id/approve
 */
export const approveRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const transaction = await transactionService.approveRequest(
      req.params.id,
      req.user!.userId
    );
    sendSuccess(res, transaction, 'Borrow request approved');
  }
);

/**
 * PUT /api/requests/:id/reject
 */
export const rejectRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await transactionService.rejectRequest(
      req.params.id,
      req.user!.userId,
      req.body.reason
    );
    sendSuccess(res, null, 'Borrow request rejected');
  }
);

// ============================================================
// Borrow Transactions
// ============================================================

/**
 * GET /api/transactions
 */
export const listTransactions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId =
      req.user!.role === 'LIBRARIAN'
        ? undefined
        : req.user!.userId;
    const { transactions, meta } = await transactionService.listTransactions(
      req.query as Record<string, unknown>,
      userId
    );
    sendSuccess(res, transactions, undefined, 200, meta);
  }
);

/**
 * PUT /api/transactions/:id/return
 */
export const returnBook = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionService.returnBook(req.params.id);
  sendSuccess(res, transaction, 'Book returned successfully');
});

// ============================================================
// Reservations
// ============================================================

/**
 * POST /api/reservations
 */
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

/**
 * PUT /api/reservations/:id/cancel
 */
export const cancelReservation = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await transactionService.cancelReservation(
      req.params.id,
      req.user!.userId
    );
    sendSuccess(res, null, 'Reservation cancelled');
  }
);

