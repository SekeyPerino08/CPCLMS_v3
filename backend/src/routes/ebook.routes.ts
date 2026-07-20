// ============================================================
// E-Book Routes
// ============================================================

import { Router } from 'express';
import * as ebookController from '../controllers/ebook.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createEBookSchema, updateEBookSchema } from '../validators/book.schema';

const router = Router();

// Public routes (any authenticated user can view)
router.get('/', ebookController.listEBooks);
router.get('/:id', ebookController.getEBook);

// Librarian-only (CRUD management)
router.post(
  '/',
  authenticate,
  authorize('LIBRARIAN'),
  validate(createEBookSchema),
  ebookController.createEBook
);
router.put(
  '/:id',
  authenticate,
  authorize('LIBRARIAN'),
  validate(updateEBookSchema),
  ebookController.updateEBook
);
router.delete(
  '/:id',
  authenticate,
  authorize('LIBRARIAN'),
  ebookController.deleteEBook
);

export default router;

