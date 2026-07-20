// ============================================================
// Report Generation Routes (LIBRARIAN only)
// ============================================================

import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('LIBRARIAN'));

router.get('/:type', reportController.generateReport);

export default router;

