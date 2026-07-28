// ============================================================
// Activity Log Controller
// ============================================================

import { Request, Response } from 'express';
import { prisma } from '../config';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination';

export const listActivityLogs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit, skip, take } = getPaginationParams(req.query as Record<string, unknown>);

  const where: any = {};

  // Filter by user (librarian can see all, normal users see own)
  if (req.user!.role !== 'LIBRARIAN') {
    where.userId = req.user!.userId;
  } else {
    if (req.query.userId) where.userId = req.query.userId as string;
  }

  if (req.query.action) where.action = req.query.action as string;
  if (req.query.entity) where.entity = req.query.entity as string;

  // Date range filter
  if (req.query.fromDate) {
    where.createdAt = { ...(where.createdAt || {}), gte: new Date(req.query.fromDate as string) };
  }
  if (req.query.toDate) {
    where.createdAt = { ...(where.createdAt || {}), lte: new Date(req.query.toDate as string) };
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, libraryId: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.activityLog.count({ where }),
  ]);

  const paginationMeta = buildPaginationMeta(total, { page, limit, skip, take });
  sendSuccess(res, logs, undefined, 200, paginationMeta);
});

export const getActivityLog = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const log = await prisma.activityLog.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, libraryId: true, role: true } },
    },
  });

  if (!log) {
    res.status(404).json({ success: false, error: 'Activity log not found' });
    return;
  }

  // Normal users can only see their own logs
  if (req.user!.role !== 'LIBRARIAN' && log.userId !== req.user!.userId) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  sendSuccess(res, log);
});

export const getDistinctActions = asyncHandler(async (_req: Request, res: Response) => {
  const actions = await prisma.activityLog.groupBy({
    by: ['action'],
    _count: { action: true },
    orderBy: { _count: { action: 'desc' } },
  });

  interface ActionGroup { action: string; _count: { action: number } }
  const actionList = (actions as ActionGroup[]).map((a: ActionGroup) => ({ action: a.action, count: a._count.action }));
  sendSuccess(res, actionList);
});

