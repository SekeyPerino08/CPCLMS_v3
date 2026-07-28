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

// All transaction routes require authentication
router.use(authenticate);

// ── Borrow Requests ──────────────────────────────────────
router.post('/requests', validate(createBorrowRequestSchema), transactionController.createBorrowRequest);
router.get('/requests', transactionController.listBorrowRequests);
router.put('/requests/:id/approve', authorize('LIBRARIAN'), transactionController.approveRequest);
router.put('/requests/:id/reject', authorize('LIBRARIAN'), validate(rejectRequestSchema), transactionController.rejectRequest);

// ── My Active Count ──────────────────────────────────────
router.get('/my-count', transactionController.getMyActiveCount);

// ── Transactions ─────────────────────────────────────────
router.get('/', transactionController.listTransactions);
router.get('/:id', transactionController.getTransaction);
router.put('/:id/return', authorize('LIBRARIAN'), validate(returnBookSchema), transactionController.returnBook);

// ── Fine Payment ─────────────────────────────────────────
router.put('/:id/pay-fine', authenticate, validate(payFineSchema), transactionController.payFine);

// ── Overdue Check (admin/cron) ───────────────────────────
router.post('/check-overdue', authorize('LIBRARIAN'), transactionController.checkOverdue);

export default router;

