// ============================================================
// Reservation Routes
// ============================================================

import { Router } from 'express';
import { transactionController } from '../controllers';
import { authenticate } from '../middlewares/auth';

const router = Router();

// All reservation routes require authentication
router.use(authenticate);

router.post('/', transactionController.reserveBook);
router.put('/:id/cancel', transactionController.cancelReservation);

export default router;

