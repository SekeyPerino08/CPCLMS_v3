// ============================================================
// Utility Helper Functions
// ============================================================

import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types';

/**
 * Generate the next library ID in sequence
 * Format: LIB-YYYY-NNNN
 */
export function generateLibraryId(counter: number): string {
  const year = new Date().getFullYear();
  const padded = String(counter).padStart(4, '0');
  return `LIB-${year}-${padded}`;
}

/**
 * Send a standardized success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  meta?: PaginationMeta
): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  res.status(statusCode).json(response);
}

/**
 * Send a standardized error response
 */
export function sendError(
  res: Response,
  error: string,
  statusCode = 400
): void {
  const response: ApiResponse = {
    success: false,
    error,
  };
  res.status(statusCode).json(response);
}

/**
 * Calculate due date based on max borrow days
 */
export function calculateDueDate(maxDays: number): Date {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + maxDays);
  return dueDate;
}

/**
 * Calculate fine for overdue books
 */
export function calculateFine(dueDate: Date, finePerDay: number): number {
  const now = new Date();
  const diffTime = now.getTime() - dueDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays * finePerDay : 0;
}

