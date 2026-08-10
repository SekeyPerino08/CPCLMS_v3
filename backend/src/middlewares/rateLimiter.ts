// ============================================================
// Rate Limiting Middleware
// ============================================================

import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * General API rate limiter.
 * Limits requests per authenticated user when available, otherwise per IP.
 * In development, rate limiting is effectively disabled (very high limits)
 * to avoid blocking the frontend during normal testing.
 */
const DISABLED_MAX = 1000000;

const getRequestKey = (req: any): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : Array.isArray(forwarded)
      ? forwarded[0]
      : req.ip || 'unknown';

  const userId = req.user?.id || req.user?.libraryId || req.headers['x-user-id'];
  return userId ? `user:${String(userId)}` : `ip:${String(ip)}`;
};

const buildLimiter = (windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getRequestKey,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: message,
      });
    },
  });

export const apiLimiter = buildLimiter(
  env.RATE_LIMIT_WINDOW_MS,
  env.RATE_LIMIT_ENABLED ? env.RATE_LIMIT_MAX : DISABLED_MAX,
  'Too many requests. Please slow down and try again shortly.'
);

/**
 * Strict rate limiter for auth endpoints (login, register, refresh).
 */
export const authLimiter = buildLimiter(
  15 * 60 * 1000,
  env.RATE_LIMIT_ENABLED ? env.AUTH_RATE_LIMIT_MAX : DISABLED_MAX,
  'Too many authentication attempts. Please wait a few minutes and try again.'
);

/**
 * Stricter limiter for borrow actions such as creating requests,
 * approving, rejecting, returning, and paying fines.
 */
export const borrowActionLimiter = buildLimiter(
  5 * 60 * 1000,
  env.RATE_LIMIT_ENABLED ? 20 : DISABLED_MAX,
  'You are submitting requests too quickly. Please wait a moment and try again.'
);
