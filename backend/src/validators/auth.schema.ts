// ============================================================
// Zod Validation Schemas — Authentication & User Management
// ============================================================

import { z } from 'zod';

// Enum values matching the Prisma Role enum
/** @see prisma/schema.prisma Role enum */
const RoleValues = ['STUDENT', 'FACULTY', 'LIBRARIAN'] as const;

export const loginSchema = z.object({
  body: z.object({
    identifier: z
      .string()
      .min(1, 'ID Number or email is required')
      .trim()
      .transform((val) => val.toLowerCase()),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50)
      .transform((s) => s.trim()),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50)
      .transform((s) => s.trim()),
    libraryId: z
      .string()
      .min(1, 'ID Number is required')
      .max(20)
      .transform((s) => s.trim()),
    email: z
      .string()
      .email('Invalid email address')
      .transform((email) => email.toLowerCase().trim()),
    role: z
      .enum(RoleValues, {
        errorMap: () => ({ message: 'Role must be STUDENT, FACULTY, or LIBRARIAN' }),
      })
      .optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128),
    department: z.string().optional(),
    yearSection: z.string().optional(),
    phone: z.string().optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50)
      .transform((s) => s.trim()),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50)
      .transform((s) => s.trim()),
    libraryId: z
      .string()
      .min(1, 'ID Number is required')
      .max(20)
      .transform((s) => s.trim()),
    email: z
      .string()
      .email('Invalid email address')
      .transform((email) => email.toLowerCase().trim()),
    phone: z
      .string()
      .optional()
      .transform((s) => (s ? s.trim() : undefined))
      .refine((val) => !val || /^\+?[\d\s-]{7,15}$/.test(val), {
        message: 'Invalid phone number format',
      }),
    department: z
      .string()
      .optional()
      .transform((s) => (s ? s.trim() : undefined)),
    yearSection: z
      .string()
      .optional()
      .transform((s) => (s ? s.trim() : undefined)),
    avatar: z
      .string()
      .optional()
      .refine((val) => !val || /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(val), {
        message: 'Avatar must be a valid JPG or PNG image data URL',
      }),
  }),
});

/** Admin-only: create user with any role */
export const createUserSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50)
      .transform((s) => s.trim()),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50)
      .transform((s) => s.trim()),
    email: z
      .string()
      .email('Invalid email address')
      .transform((email) => email.toLowerCase().trim()),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128),
    role: z.enum(RoleValues, {
      errorMap: () => ({ message: 'Role must be STUDENT, FACULTY, or LIBRARIAN' }),
    }),
    department: z.string().optional(),
    yearSection: z.string().optional(),
    phone: z
      .string()
      .regex(/^\+?[\d\s-]{7,15}$/, 'Invalid phone number format')
      .optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

// Types
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];

