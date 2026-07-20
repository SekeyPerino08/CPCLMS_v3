// ============================================================
// Zod Request Validation Middleware
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/helpers';

/**
 * Validates request body, query, and params against a Zod schema.
 * @param schema - A Zod schema with optional `body`, `query`, `params` keys
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        sendError(res, JSON.stringify(formattedErrors), 400);
        return;
      }
      sendError(res, 'Validation failed', 400);
    }
  };
};

