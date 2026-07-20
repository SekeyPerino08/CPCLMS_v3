// ============================================================
// Zod Validation Schemas — Books & Categories
// ============================================================

import { z } from 'zod';

export const createBookSchema = z.object({
  body: z.object({
    isbn: z.string().min(1, 'ISBN is required'),
    accessionNo: z.string().min(1, 'Accession number is required'),
    title: z.string().min(1, 'Title is required').max(255),
    author: z.string().min(1, 'Author is required').max(255),
    publisher: z.string().optional(),
    publishYear: z.coerce.number().int().min(1000).max(9999).optional(),
    edition: z.string().optional(),
    pages: z.coerce.number().int().positive().optional(),
    categoryId: z.string().optional(),
    description: z.string().optional(),
    language: z.string().default('English'),
    shelf: z.string().optional(),
    row: z.string().optional(),
    copies: z.coerce.number().int().positive().default(1),
  }),
});

export const updateBookSchema = z.object({
  body: z.object({
    isbn: z.string().optional(),
    title: z.string().max(255).optional(),
    author: z.string().max(255).optional(),
    publisher: z.string().optional(),
    publishYear: z.coerce.number().int().min(1000).max(9999).optional(),
    edition: z.string().optional(),
    pages: z.coerce.number().int().positive().optional(),
    categoryId: z.string().optional(),
    description: z.string().optional(),
    language: z.string().optional(),
    shelf: z.string().optional(),
    row: z.string().optional(),
    copies: z.coerce.number().int().positive().optional(),
    status: z.enum(['AVAILABLE', 'BORROWED', 'RESERVED', 'MAINTENANCE', 'LOST']).optional(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    slug: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes')
      .optional(),
    description: z.string().optional(),
    parentId: z.string().optional(),
  }),
});

// ─── E-Book Schemas ──────────────────────────────────────

export const createEBookSchema = z.object({
  body: z.object({
    isbn: z.string().min(1, 'ISBN is required'),
    title: z.string().min(1, 'Title is required').max(255),
    author: z.string().min(1, 'Author is required').max(255),
    publisher: z.string().optional(),
    publishYear: z.coerce.number().int().min(1000).max(9999).optional(),
    edition: z.string().optional(),
    categoryId: z.string().optional(),
    description: z.string().optional(),
    coverImage: z.string().url().optional(),
    language: z.string().default('English'),
    fileUrl: z.string().url('File URL must be a valid URL'),
    fileSize: z.coerce.number().int().positive().optional(),
    format: z.enum(['PDF', 'EPUB', 'MOBI']).default('PDF'),
  }),
});

export const updateEBookSchema = z.object({
  body: z.object({
    isbn: z.string().optional(),
    title: z.string().max(255).optional(),
    author: z.string().max(255).optional(),
    publisher: z.string().optional(),
    publishYear: z.coerce.number().int().min(1000).max(9999).optional(),
    edition: z.string().optional(),
    categoryId: z.string().optional(),
    description: z.string().optional(),
    coverImage: z.string().url().optional(),
    language: z.string().optional(),
    fileUrl: z.string().url().optional(),
    fileSize: z.coerce.number().int().positive().optional(),
    format: z.enum(['PDF', 'EPUB', 'MOBI']).optional(),
  }),
});

// ─── Category Update Schema ──────────────────────────────

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes')
      .optional(),
    description: z.string().optional(),
    parentId: z.string().nullable().optional(),
  }),
});

export type CreateBookInput = z.infer<typeof createBookSchema>['body'];
export type UpdateBookInput = z.infer<typeof updateBookSchema>['body'];
export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
export type CreateEBookInput = z.infer<typeof createEBookSchema>['body'];
export type UpdateEBookInput = z.infer<typeof updateEBookSchema>['body'];

