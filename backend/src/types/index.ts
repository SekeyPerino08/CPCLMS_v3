// ============================================================
// Shared TypeScript Types for the Library System
// ============================================================

import { Request } from 'express';
import { Role } from '@prisma/client';

// JWT Payload stored in token
export interface JwtPayload {
  userId: string;
  libraryId: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// Authenticated request with user info attached by middleware
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Standard API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

