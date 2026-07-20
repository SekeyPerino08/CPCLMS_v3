// ============================================================
// Category Routes
// ============================================================

import { Router } from 'express';
import { bookController } from '../controllers';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createCategorySchema, updateCategorySchema } from '../validators/book.schema';

const router = Router();

// Public routes
router.get('/', bookController.listCategories);
router.get('/:id', bookController.getCategory);

// Librarian-only
router.post('/', authenticate, authorize('LIBRARIAN'), validate(createCategorySchema), bookController.createCategory);
router.put('/:id', authenticate, authorize('LIBRARIAN'), validate(updateCategorySchema), bookController.updateCategory);
router.delete('/:id', authenticate, authorize('LIBRARIAN'), bookController.deleteCategory);

export default router;

