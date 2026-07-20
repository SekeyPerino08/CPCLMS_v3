// ============================================================
// Book & Category Controller
// ============================================================

import { Request, Response } from 'express';
import { bookService } from '../services';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/helpers';

// ============================================================
// Physical Books
// ============================================================

/**
 * GET /api/books
 */
export const listBooks = asyncHandler(async (req: Request, res: Response) => {
  const { books, meta } = await bookService.listBooks(req.query as Record<string, unknown>);
  sendSuccess(res, books, undefined, 200, meta);
});

/**
 * GET /api/books/:id
 */
export const getBook = asyncHandler(async (req: Request, res: Response) => {
  const book = await bookService.getBookById(req.params.id);
  sendSuccess(res, book);
});

/**
 * POST /api/books
 */
export const createBook = asyncHandler(async (req: Request, res: Response) => {
  const book = await bookService.createBook(req.body);
  sendSuccess(res, book, 'Book created successfully', 201);
});

/**
 * PUT /api/books/:id
 */
export const updateBook = asyncHandler(async (req: Request, res: Response) => {
  const book = await bookService.updateBook(req.params.id, req.body);
  sendSuccess(res, book, 'Book updated successfully');
});

/**
 * DELETE /api/books/:id
 */
export const deleteBook = asyncHandler(async (req: Request, res: Response) => {
  await bookService.deleteBook(req.params.id);
  sendSuccess(res, null, 'Book deleted successfully');
});

// ============================================================
// Categories
// ============================================================

/**
 * GET /api/categories
 */
export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await bookService.listCategories();
  sendSuccess(res, categories);
});

/**
 * GET /api/categories/:id
 */
export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await bookService.getCategoryById(req.params.id);
  sendSuccess(res, category);
});

/**
 * POST /api/categories
 */
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await bookService.createCategory(req.body);
  sendSuccess(res, category, 'Category created successfully', 201);
});

/**
 * PUT /api/categories/:id
 */
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await bookService.updateCategory(req.params.id, req.body);
  sendSuccess(res, category, 'Category updated successfully');
});

/**
 * DELETE /api/categories/:id
 */
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await bookService.deleteCategory(req.params.id);
  sendSuccess(res, null, 'Category deleted successfully');
});

