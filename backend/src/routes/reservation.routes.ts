// ============================================================
// Reservation Routes
// ============================================================

import { Router } from 'express';
import { transactionController } from '../controllers';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { reserveBookSchema } from '../validators/transaction.schema';

const router = Router();

// All reservation routes require authentication
router.use(authenticate);

// ── CRUD ─────────────────────────────────────────────────
router.post('/', validate(reserveBookSchema), transactionController.reserveBook);
router.get('/', transactionController.listReservations);
router.put('/:id/cancel', transactionController.cancelReservation);

export default router;

