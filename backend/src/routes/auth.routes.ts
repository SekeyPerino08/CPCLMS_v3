// ============================================================
// Authentication & User Management Routes
// ============================================================

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimiter';
import { validate } from '../middlewares/validate';
import {
  loginSchema,
  registerSchema,
  createUserSchema,
  changePasswordSchema,
  refreshTokenSchema,
  logoutSchema,
} from '../validators/auth.schema';

const router = Router();

// ─── Public Routes (rate-limited) ──────────────────────────
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/refresh', authLimiter, validate(refreshTokenSchema), authController.refreshToken);

// ─── Authenticated Routes ────────────────────────────────
router.get('/me', authenticate, authController.getProfile);
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);
router.post('/logout', authenticate, validate(logoutSchema), authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);

// ─── Admin / Librarian Routes ─────────────────────────────
router.get(
  '/users',
  authenticate,
  authorize('LIBRARIAN'),
  authController.listUsers
);
router.post(
  '/admin/users',
  authenticate,
  authorize('LIBRARIAN'),
  validate(createUserSchema),
  authController.createUser
);
router.patch(
  '/users/:id/toggle-status',
  authenticate,
  authorize('LIBRARIAN'),
  authController.toggleUserStatus
);
router.delete(
  '/users/:id',
  authenticate,
  authorize('LIBRARIAN'),
  authController.deleteUser
);

export default router;

