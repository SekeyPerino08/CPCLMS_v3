// ============================================================
// Route Registration
// ============================================================

import { Router } from 'express';
import authRoutes from './auth.routes';
import bookRoutes from './book.routes';
import categoryRoutes from './category.routes';
import ebookRoutes from './ebook.routes';
import transactionRoutes from './transaction.routes';
import reservationRoutes from './reservation.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/categories', categoryRoutes);
router.use('/ebooks', ebookRoutes);
router.use('/transactions', transactionRoutes);
router.use('/reservations', reservationRoutes);

export default router;

