// ============================================================
// Borrow Transaction Routes
// ============================================================

import { Router } from 'express';
import { transactionController } from '../controllers';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  createBorrowRequestSchema,
  rejectRequestSchema,
  returnBookSchema,
  payFineSchema,
} from '../validators/transaction.schema';

const router = Router();

// ── Public QR Approval Confirmation ─────────────────────
// The borrower opens this via the QR deep link on their phone.
// Authorization is the token embedded in the QR, NOT a JWT session,
// so this must be registered BEFORE the global authenticate middleware.
router.post('/requests/approve-qr', transactionController.approveByQRCode);

// All transaction routes require authentication
router.use(authenticate);

// ── Borrow Requests ──────────────────────────────────────
router.post('/requests', validate(createBorrowRequestSchema), transactionController.createBorrowRequest);
router.get('/requests', transactionController.listBorrowRequests);
router.get('/requests/:id', transactionController.getBorrowRequest);
router.put('/requests/:id/approve', authorize('LIBRARIAN'), transactionController.approveRequest);
router.put('/requests/:id/reject', authorize('LIBRARIAN'), validate(rejectRequestSchema), transactionController.rejectRequest);

// ── QR-based Approval Flow ───────────────────────────────
// Generate a unique QR code for a pending request (librarian only).
router.get('/requests/:id/qr', authorize('LIBRARIAN'), transactionController.generateRequestQR);

// ── My Active Count ──────────────────────────────────────
router.get('/my-count', transactionController.getMyActiveCount);

// ── Transactions ─────────────────────────────────────────
router.get('/', transactionController.listTransactions);
router.get('/:id', transactionController.getTransaction);
router.put('/:id/return', validate(returnBookSchema), transactionController.returnBook);
router.put('/:id/missing', authorize('LIBRARIAN'), transactionController.declareMissing);

// ── Fine Payment ─────────────────────────────────────────
router.put('/:id/pay-fine', authenticate, validate(payFineSchema), transactionController.payFine);

// ── Overdue Check (admin/cron) ───────────────────────────
router.post('/check-overdue', authorize('LIBRARIAN'), transactionController.checkOverdue);

export default router;

