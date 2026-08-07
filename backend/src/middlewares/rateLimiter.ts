// ============================================================
// Rate Limiting Middleware
// ============================================================

import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * General API rate limiter
 * Limits requests per IP within a time window.
 *
 * In development, rate limiting is effectively disabled (very high
 * limits) to avoid blocking the frontend's token-refresh flow and
 * hot-reloads. In production, it uses RATE_LIMIT_WINDOW_MS and
 * RATE_LIMIT_MAX from the environment (defaults: 15 min / 100 req).
 */
// If rate limiting is disabled, use a huge max so it never trips.
const DISABLED_MAX = 1000000;

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_ENABLED
    ? env.RATE_LIMIT_MAX
    : DISABLED_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
});

/**
 * Strict rate limiter for auth endpoints (login, register, refresh)
 * In development (or when RATE_LIMIT_ENABLED=false), allow many attempts.
 * In production, limits to AUTH_RATE_LIMIT_MAX requests per 15 min per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.RATE_LIMIT_ENABLED
    ? env.AUTH_RATE_LIMIT_MAX
    : DISABLED_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
});
