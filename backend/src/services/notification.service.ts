// ============================================================
// Notification Service
// - In-app notifications CRUD
// - Simulated email notification (logs to console + ActivityLog)
// ============================================================

import { prisma } from '../config';
import { NotificationType } from '@prisma/client';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination';
import { NotFoundError } from '../utils/errors';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  userId?: string;
}

export class NotificationService {
  /**
   * Create a notification for every librarian in the system.
   * Used for events the librarian must act on (e.g. new borrow request, book return).
   */
  async notifyAllLibrarians(
    type: NotificationType,
    title: string,
    message?: string,
    link?: string
  ): Promise<number> {
    const librarians = await prisma.user.findMany({
      where: { role: 'LIBRARIAN', isActive: true },
      select: { id: true },
    });

    if (librarians.length === 0) return 0;

    const result = await prisma.notification.createMany({
      data: librarians.map((lib) => ({
        userId: lib.id,
        type,
        title,
        message,
        link,
      })),
    });

    return result.count;
  }

  /**
   * Create an in-app notification
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message?: string,
    link?: string
  ) {
    const notification = await prisma.notification.create({
      data: { userId, type, title, message, link },
    });

    // Also simulate email notification
    await this.sendEmail({
      to: userId, // In production, would be user.email
      subject: title,
      body: message || title,
      userId,
    });

    return notification;
  }

  /**
   * Get notifications for a user with pagination
   */
  async getUserNotifications(userId: string, query: Record<string, unknown>) {
    const { page, limit, skip, take } = getPaginationParams(query);

    const where: any = { userId };
    if (query.unreadOnly === 'true' || query.unreadOnly === true) {
      where.isRead = false;
    }
    if (query.type) where.type = query.type;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      meta: buildPaginationMeta(total, { page, limit, skip, take }),
      unreadCount,
    };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) throw new NotFoundError('Notification');
    if (notification.userId !== userId) {
      throw new NotFoundError('Notification');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) throw new NotFoundError('Notification');
    if (notification.userId !== userId) {
      throw new NotFoundError('Notification');
    }

    await prisma.notification.delete({ where: { id: notificationId } });
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // ============================================================
  // Email Simulation
  // In production, replace this with nodemailer/SendGrid/etc.
  // ============================================================

  /**
   * Simulated email sending — logs to console and creates activity log
   */
  async sendEmail(payload: EmailPayload): Promise<void> {
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('');
      console.log('📧 [EMAIL SIMULATION]');
      console.log(`   To:      ${payload.to}`);
      console.log(`   Subject: ${payload.subject}`);
      console.log(`   Body:    ${payload.body}`);
      console.log('');
    }

    // Log the email in ActivityLog
    if (payload.userId) {
      await prisma.activityLog.create({
        data: {
          userId: payload.userId,
          action: 'EMAIL_SENT',
          entity: 'Notification',
          details: {
            type: 'email',
            subject: payload.subject,
            to: payload.to,
          },
        },
      });
    }
  }

  /**
   * Send bulk due-date reminders to all users with books due tomorrow
   * Example cron job function
   */
  async sendDueDateReminders(): Promise<{ sent: number }> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const dueTomorrow = await prisma.borrowTransaction.findMany({
      where: {
        status: 'ACTIVE',
        dueDate: { gte: tomorrow, lt: dayAfter },
      },
      include: {
        user: { select: { id: true, email: true, firstName: true } },
        book: { select: { title: true, accessionNo: true } },
      },
    });

    for (const txn of dueTomorrow) {
      const message = `Reminder: "${txn.book.title}" (${txn.book.accessionNo}) is due tomorrow (${txn.dueDate.toLocaleDateString()}). Please return or renew.`;

      await this.createNotification(
        txn.user.id,
        'DUE_REMINDER',
        'Book Due Tomorrow',
        message,
        `/transactions/${txn.id}`
      );
    }

    return { sent: dueTomorrow.length };
  }
}

export const notificationService = new NotificationService();

