// ============================================================
// Authentication Controller
// ============================================================

import { Request, Response } from 'express';
import { authService } from '../services';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  const ipAddress = req.ip;
  const result = await authService.login(identifier, password, ipAddress);
  sendSuccess(res, result, 'Login successful');
});

/**
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const ipAddress = req.ip;
  const result = await authService.register(req.body, ipAddress);
  sendSuccess(res, result, 'Registration successful', 201);
});

/**
 * POST /api/auth/admin/users  (LIBRARIAN only)
 */
export const createUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ipAddress = req.ip;
  const user = await authService.createUser(req.user!.userId, req.body, ipAddress);
  sendSuccess(res, user, 'User created successfully', 201);
});

/**
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  const ipAddress = req.ip;
  const result = await authService.refreshAccessToken(token, ipAddress);
  sendSuccess(res, result, 'Token refreshed successfully');
});

/**
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { refreshToken: token } = req.body;
  if (token) {
    await authService.logout(token);
  }
  sendSuccess(res, null, 'Logged out successfully');
});

/**
 * POST /api/auth/logout-all
 */
export const logoutAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await authService.logoutAll(req.user!.userId);
  sendSuccess(res, null, 'All sessions logged out successfully');
});

/**
 * GET /api/auth/me
 */
export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.getProfile(req.user!.userId);
  sendSuccess(res, user);
});

/**
 * PUT /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.userId, currentPassword, newPassword);
  sendSuccess(res, null, 'Password changed successfully');
});

/**
 * GET /api/auth/users  (LIBRARIAN only)
 */
export const listUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await authService.listUsers(req.query as Record<string, unknown>);
  sendSuccess(res, result.users, undefined, 200, result.meta);
});

/**
 * DELETE /api/auth/users/:id  (LIBRARIAN only)
 */
export const deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.deleteUser(req.params.id, req.user!.userId);
  sendSuccess(res, user, 'User deleted successfully');
});

/**
 * PATCH /api/auth/users/:id/toggle-status  (LIBRARIAN only)
 */
export const toggleUserStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.toggleUserStatus(req.params.id, req.user!.userId);
  const status = user.isActive ? 'activated' : 'deactivated';
  sendSuccess(res, user, `User ${status} successfully`);
});

