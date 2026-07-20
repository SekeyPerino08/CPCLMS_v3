// ============================================================
// Borrow Transaction Routes
// ============================================================

import { Router } from 'express';
import { transactionController } from '../controllers';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// All transaction routes require authentication
router.use(authenticate);

// Borrow Requests
router.post('/requests', transactionController.createBorrowRequest);
router.get('/requests', transactionController.listBorrowRequests);
router.put('/requests/:id/approve', authorize('LIBRARIAN'), transactionController.approveRequest);
router.put('/requests/:id/reject', authorize('LIBRARIAN'), transactionController.rejectRequest);

// Transactions
router.get('/', transactionController.listTransactions);
router.put('/:id/return', authorize('LIBRARIAN'), transactionController.returnBook);

export default router;

