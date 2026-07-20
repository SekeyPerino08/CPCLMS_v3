// ============================================================
// Book & Category Routes
// ============================================================

import { Router } from 'express';
import { bookController } from '../controllers';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createBookSchema, updateBookSchema, createCategorySchema } from '../validators/book.schema';

const router = Router();

// Physical Books
router.get('/', bookController.listBooks);
router.get('/:id', bookController.getBook);

// Librarian-only
router.post('/', authenticate, authorize('LIBRARIAN'), validate(createBookSchema), bookController.createBook);
router.put('/:id', authenticate, authorize('LIBRARIAN'), validate(updateBookSchema), bookController.updateBook);
router.delete('/:id', authenticate, authorize('LIBRARIAN'), bookController.deleteBook);

export default router;

