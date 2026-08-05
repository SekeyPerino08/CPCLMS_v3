// ============================================================
// Authentication Service
// Implements JWT access + refresh token rotation (Bearer + httpOnly cookie)
// Security: short-lived access tokens, refresh token rotation, bcrypt(12)
// ============================================================

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config';
import { env } from '../config/env';
import { JwtPayload } from '../types';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} from '../utils/errors';
import { RegisterInput, CreateUserInput } from '../validators';

export class AuthService {
  // ────────────────────────────────────────
  //  PUBLIC: LOGIN
  // ────────────────────────────────────────
  async login(identifier: string, password: string, ipAddress?: string) {
    const normalized = (identifier || '').trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalized }, { libraryId: normalized }],
      },
    });
    if (!user) {
      throw new UnauthorizedError('Invalid ID Number or password');
    }
    if (!user.isActive) {
      throw new UnauthorizedError(
        'Your account has been deactivated. Please contact the library.'
      );
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedError('Invalid ID Number or password');
    }

    // Generate token pair
    const accessToken = this.generateAccessToken(user.id, user.libraryId, user.role);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Log activity
    await this.logActivity(user.id, 'LOGIN', 'User', user.id, ipAddress);

    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: 15 * 60, // seconds (matches JWT_EXPIRES_IN = 15m)
      user: this.sanitizeUser(user),
    };
  }

  // ────────────────────────────────────────
  //  PUBLIC: REGISTER (self-registration → STUDENT role)
  // ────────────────────────────────────────
async register(input: RegisterInput, ipAddress?: string) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { libraryId: input.libraryId }],
      },
    });
    if (existing) {
      throw new ConflictError(
        existing.email === input.email
          ? 'An account with this email already exists'
          : 'An account with this ID Number already exists'
      );
    }

    const libraryId = input.libraryId;
    const hashedPassword = await bcrypt.hash(input.password, 12);

const user = await prisma.user.create({
      data: {
        libraryId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        password: hashedPassword,
        role: input.role || 'STUDENT',
        department: input.department,
        yearSection: input.yearSection,
        phone: input.phone,
      },
    });

    const accessToken = this.generateAccessToken(user.id, user.libraryId, user.role);
    const refreshToken = await this.generateRefreshToken(user.id);

    await this.logActivity(user.id, 'REGISTER', 'User', user.id, ipAddress);

    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: 15 * 60,
      user: this.sanitizeUser(user),
    };
  }

  // ────────────────────────────────────────
  //  ADMIN: Create user with any role (LIBRARIAN only)
  // ────────────────────────────────────────
  async createUser(adminId: string, input: CreateUserInput, ipAddress?: string) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const libraryId = await this.generateLibraryId();
    const hashedPassword = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        libraryId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        password: hashedPassword,
        role: input.role,
        department: input.department,
        yearSection: input.yearSection,
        phone: input.phone,
        isActive: true,
      },
    });

    await this.logActivity(adminId, 'CREATE_USER', 'User', user.id, ipAddress);

    return this.sanitizeUser(user);
  }

  // ────────────────────────────────────────
  //  REFRESH TOKEN
  // ────────────────────────────────────────
  async refreshAccessToken(refreshTokenStr: string, ipAddress?: string) {
    // Find the stored token
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenStr },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if revoked
    if (storedToken.revokedAt) {
      // Token was already used → possible theft: revoke ALL tokens for this user
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedError(
        'Refresh token has been revoked. All sessions have been invalidated for security.'
      );
    }

    // Check expiry
    if (new Date() > storedToken.expiresAt) {
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedError('Refresh token has expired. Please log in again.');
    }

    // Check user active
    if (!storedToken.user.isActive) {
      throw new UnauthorizedError('Account is deactivated.');
    }

    // Rotate: revoke old, issue new
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const accessToken = this.generateAccessToken(
      storedToken.user.id,
      storedToken.user.libraryId,
      storedToken.user.role
    );
    const newRefreshToken = await this.generateRefreshToken(storedToken.userId);

    await this.logActivity(
      storedToken.userId,
      'TOKEN_REFRESH',
      'User',
      storedToken.userId,
      ipAddress
    );

    return {
      accessToken,
      refreshToken: newRefreshToken.token,
      expiresIn: 15 * 60,
    };
  }

  // ────────────────────────────────────────
  //  LOGOUT (revoke specific refresh token)
  // ────────────────────────────────────────
  async logout(refreshTokenStr: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshTokenStr, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ────────────────────────────────────────
  //  LOGOUT ALL SESSIONS
  // ────────────────────────────────────────
  async logoutAll(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ────────────────────────────────────────
  //  CHANGE PASSWORD
  // ────────────────────────────────────────
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    // Invalidate all other sessions (security best practice)
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ────────────────────────────────────────
  //  GET PROFILE (with active borrows, reservations, notifications)
  // ────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        borrowTransactions: {
          where: { status: 'ACTIVE' },
          include: { book: { select: { title: true, accessionNo: true } } },
          orderBy: { borrowDate: 'desc' },
          take: 5,
        },
        reservations: {
          where: { status: 'ACTIVE' },
          include: { book: { select: { title: true } } },
          orderBy: { reservationDate: 'desc' },
          take: 5,
        },
        notifications: {
          where: { isRead: false },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            borrowTransactions: { where: { status: 'ACTIVE' } },
            reservations: { where: { status: 'ACTIVE' } },
            notifications: { where: { isRead: false } },
          },
        },
      },
    });

    if (!user) throw new NotFoundError('User');

    return this.sanitizeUser(user);
  }

  // ────────────────────────────────────────
  //  LIST USERS (admin)
  // ────────────────────────────────────────
  async listUsers(query: Record<string, unknown>) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search as string, mode: 'insensitive' } },
        { lastName: { contains: query.search as string, mode: 'insensitive' } },
        { email: { contains: query.search as string, mode: 'insensitive' } },
        { libraryId: { contains: query.search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          libraryId: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          department: true,
          yearSection: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

// ────────────────────────────────────────
  //  TOGGLE USER ACTIVE STATUS (admin)
  // ────────────────────────────────────────
  async deleteUser(targetUserId: string, adminId: string) {
    if (targetUserId === adminId) {
      throw new BadRequestError('You cannot delete your own account');
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundError('User');

    // Delete related records in a single transaction
    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId: targetUserId } }),
      prisma.activityLog.deleteMany({ where: { userId: targetUserId } }),
      prisma.notification.deleteMany({ where: { userId: targetUserId } }),
      prisma.borrowRequest.deleteMany({ where: { userId: targetUserId } }),
      prisma.borrowRequest.deleteMany({ where: { processedById: targetUserId } }),
      prisma.borrowTransaction.deleteMany({ where: { userId: targetUserId } }),
      prisma.reservation.deleteMany({ where: { userId: targetUserId } }),
      prisma.user.delete({ where: { id: targetUserId } }),
    ]);

    await this.logActivity(adminId, 'DELETE_USER', 'User', targetUserId);
    return { id: targetUserId };
  }

  async toggleUserStatus(targetUserId: string, adminId: string) {
    if (targetUserId === adminId) {
      throw new BadRequestError('You cannot deactivate your own account');
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundError('User');

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: !user.isActive },
    });

    // If deactivating, revoke all sessions
    if (updated.isActive === false) {
      await prisma.refreshToken.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return this.sanitizeUser(updated);
  }

  // ────────────────────────────────────────
  //  PRIVATE HELPERS
  // ────────────────────────────────────────

  /**
   * Generate a short-lived JWT access token.
   * JWT payload contains only: userId, libraryId, role — NO sensitive data.
   */
  private generateAccessToken(userId: string, libraryId: string, role: string): string {
    return jwt.sign(
      { userId, libraryId, role } as JwtPayload,
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as string } as jwt.SignOptions
    );
  }

  /**
   * Generate a cryptographically random refresh token and store it hashed in DB.
   * Returns the raw token (to deliver to client) and the DB record.
   */
  private async generateRefreshToken(userId: string) {
    // Clean up expired tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });

    const rawToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const record = await prisma.refreshToken.create({
      data: {
        userId,
        token: rawToken,
        expiresAt,
      },
    });

    return { token: rawToken, record };
  }

  /**
   * Auto-generate next library ID: LIB-YYYY-NNNN
   */
  private async generateLibraryId(): Promise<string> {
    const lastUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { libraryId: true },
    });

    let nextNumber = 1;
    if (lastUser?.libraryId) {
      const parts = lastUser.libraryId.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }

    const year = new Date().getFullYear();
    return `LIB-${year}-${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Log an activity to the audit trail
   */
  private async logActivity(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    ipAddress?: string
  ) {
    try {
      await prisma.activityLog.create({
        data: { userId, action, entity, entityId, ipAddress },
      });
    } catch {
      // Non-critical — don't block auth flow if logging fails
    }
  }

  /**
   * Strip password from user object
   */
  private sanitizeUser<T extends { password?: string }>(user: T): Omit<T, 'password'> {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}

export const authService = new AuthService();

