// ============================================================
// Global Error Handling Middleware
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

/**
 * Global Express error handler — catches both operational and programming errors
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  console.error(`[${new Date().toISOString()}] ERROR:`, {
    name: err.name,
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Operational error (expected, known error)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Prisma known errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    // Unique constraint violation
    if (prismaErr.code === 'P2002') {
      const field = prismaErr.meta?.target?.[0] || 'field';
      res.status(409).json({
        success: false,
        error: `A record with this ${field} already exists`,
      });
      return;
    }
    // Foreign key violation
    if (prismaErr.code === 'P2003') {
      res.status(400).json({
        success: false,
        error: 'Referenced record not found',
      });
      return;
    }
    // Record not found
    if (prismaErr.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Record not found',
      });
      return;
    }
  }

  // Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    res.status(400).json({
      success: false,
      error: 'Invalid data provided',
    });
    return;
  }

  // Default: 500 Internal Server Error
  res.status(500).json({
    success: false,
    error: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

