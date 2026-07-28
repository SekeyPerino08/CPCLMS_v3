// ============================================================
// Zod Validation Schemas — Transactions & Reservations
// ============================================================

import { z } from 'zod';

/**
 * Create a borrow request
 */
export const createBorrowRequestSchema = z.object({
  body: z.object({
    bookId: z.string().min(1, 'Book ID is required'),
    notes: z.string().max(500).optional(),
  }),
});

/**
 * Approve a borrow request (librarian)
 */
export const approveRequestSchema = z.object({
  body: z.object({
    dueDate: z.string().datetime().optional(), /// Optional override for due date
  }),
});

/**
 * Reject a borrow request (librarian)
 */
export const rejectRequestSchema = z.object({
  body: z.object({
    reason: z.string().min(1, 'Reason is required').max(500),
  }),
});

/**
 * Return a book via QR scan
 */
export const returnBookSchema = z.object({
  body: z.object({
    qrCode: z.string().optional(), /// QR code payload (optional — can return by transaction ID too)
  }),
});

/**
 * Reserve a book
 */
export const reserveBookSchema = z.object({
  body: z.object({
    bookId: z.string().min(1, 'Book ID is required'),
  }),
});

/**
 * Pay fine
 */
export const payFineSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive('Fine amount must be positive'),
  }),
});

// Types
export type CreateBorrowRequestInput = z.infer<typeof createBorrowRequestSchema>['body'];
export type ApproveRequestInput = z.infer<typeof approveRequestSchema>['body'];
export type RejectRequestInput = z.infer<typeof rejectRequestSchema>['body'];
export type ReturnBookInput = z.infer<typeof returnBookSchema>['body'];
export type ReserveBookInput = z.infer<typeof reserveBookSchema>['body'];

