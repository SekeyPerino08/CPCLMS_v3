// ============================================================
// Notification Controller
// ============================================================

import { Response } from 'express';
import { notificationService } from '../services';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';

export const listNotifications = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { notifications, meta, unreadCount } =
      await notificationService.getUserNotifications(
        req.user!.userId,
        req.query as Record<string, unknown>
      );
    sendSuccess(res, { notifications, unreadCount }, undefined, 200, meta);
  }
);

export const markAsRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user!.userId
    );
    sendSuccess(res, notification, 'Notification marked as read');
  }
);

export const markAllAsRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await notificationService.markAllAsRead(req.user!.userId);
    sendSuccess(res, result, 'All notifications marked as read');
  }
);

export const deleteNotification = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await notificationService.deleteNotification(req.params.id, req.user!.userId);
    sendSuccess(res, null, 'Notification deleted');
  }
);

export const getUnreadCount = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!.userId);
    sendSuccess(res, { unreadCount: count });
  }
);

