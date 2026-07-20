// ============================================================
// E-Book Controller
// ============================================================

import { Request, Response } from 'express';
import { ebookService } from '../services';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/helpers';

/**
 * GET /api/ebooks
 */
export const listEBooks = asyncHandler(async (req: Request, res: Response) => {
  const { ebooks, meta } = await ebookService.listEBooks(req.query as Record<string, unknown>);
  sendSuccess(res, ebooks, undefined, 200, meta);
});

/**
 * GET /api/ebooks/:id
 */
export const getEBook = asyncHandler(async (req: Request, res: Response) => {
  const ebook = await ebookService.getEBookById(req.params.id);
  sendSuccess(res, ebook);
});

/**
 * POST /api/ebooks
 */
export const createEBook = asyncHandler(async (req: Request, res: Response) => {
  const ebook = await ebookService.createEBook(req.body);
  sendSuccess(res, ebook, 'E-Book created successfully', 201);
});

/**
 * PUT /api/ebooks/:id
 */
export const updateEBook = asyncHandler(async (req: Request, res: Response) => {
  const ebook = await ebookService.updateEBook(req.params.id, req.body);
  sendSuccess(res, ebook, 'E-Book updated successfully');
});

/**
 * DELETE /api/ebooks/:id
 */
export const deleteEBook = asyncHandler(async (req: Request, res: Response) => {
  await ebookService.deleteEBook(req.params.id);
  sendSuccess(res, null, 'E-Book deleted successfully');
});

