// ============================================================
// Smart Library Management System - Express Application Entry Point
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import routes from './routes';
import { apiLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// ============================================================
// Security Middleware
// ============================================================
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ============================================================
// Body Parsing
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(env.COOKIE_SECRET));

// ============================================================
// Rate Limiting (global)
// ============================================================
app.use('/api', apiLimiter);

// ============================================================
// API Routes
// ============================================================
app.use('/api', routes);

// ============================================================
// 404 Handler
// ============================================================
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// ============================================================
// Global Error Handler (must be last)
// ============================================================
app.use(errorHandler);

// ============================================================
// Start Server
// ============================================================
app.listen(env.PORT, () => {
  console.log(`🚀  Library API server running on http://localhost:${env.PORT}`);
  console.log(`📚  Environment: ${env.NODE_ENV}`);
  console.log(`🔗  Frontend URL: ${env.FRONTEND_URL}`);

  if (env.NODE_ENV === 'development') {
    console.log('');
    console.log('   Available routes:');
    console.log('   POST   /api/auth/login');
    console.log('   POST   /api/auth/register');
    console.log('   GET    /api/auth/me');
    console.log('   GET    /api/books');
    console.log('   GET    /api/books/:id');
    console.log('   POST   /api/books               (LIBRARIAN)');
    console.log('   PUT    /api/books/:id            (LIBRARIAN)');
    console.log('   DELETE /api/books/:id            (LIBRARIAN)');
    console.log('   GET    /api/ebooks');
    console.log('   GET    /api/ebooks/:id');
    console.log('   POST   /api/ebooks               (LIBRARIAN)');
    console.log('   PUT    /api/ebooks/:id            (LIBRARIAN)');
    console.log('   DELETE /api/ebooks/:id            (LIBRARIAN)');
    console.log('   GET    /api/categories');
    console.log('   GET    /api/categories/:id');
    console.log('   POST   /api/categories            (LIBRARIAN)');
    console.log('   PUT    /api/categories/:id         (LIBRARIAN)');
    console.log('   DELETE /api/categories/:id         (LIBRARIAN)');
    console.log('   POST   /api/transactions/requests');
    console.log('   GET    /api/transactions/requests');
    console.log('   PUT    /api/transactions/requests/:id/approve');
    console.log('   PUT    /api/transactions/requests/:id/reject');
    console.log('   GET    /api/transactions');
    console.log('   PUT    /api/transactions/:id/return');
    console.log('   POST   /api/reservations');
    console.log('   PUT    /api/reservations/:id/cancel');
    console.log('');
  }
});

export default app;

