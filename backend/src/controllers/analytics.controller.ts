// ============================================================
// Analytics Controller
// ============================================================

import { Request, Response } from 'express';
import { analyticsService } from '../services';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await analyticsService.getDashboardStats();
  sendSuccess(res, stats);
});

export const getMyDashboardStats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const stats = await analyticsService.getMyDashboardStats(req.user!.userId);
    sendSuccess(res, stats);
  }
);

export const getMonthlyTrends = asyncHandler(async (req: Request, res: Response) => {
  const months = parseInt(req.query.months as string) || 6;
  const trends = await analyticsService.getMonthlyTrends(months);
  sendSuccess(res, trends);
});

export const getCategoryDistribution = asyncHandler(async (_req: Request, res: Response) => {
  const distribution = await analyticsService.getCategoryDistribution();
  sendSuccess(res, distribution);
});

