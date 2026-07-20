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
import policyRoutes from './policy.routes';
import analyticsRoutes from './analytics.routes';
import reportRoutes from './report.routes';
import activityRoutes from './activity.routes';
import notificationRoutes from './notification.routes';

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
router.use('/policies', policyRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/activities', activityRoutes);
router.use('/notifications', notificationRoutes);

export default router;

