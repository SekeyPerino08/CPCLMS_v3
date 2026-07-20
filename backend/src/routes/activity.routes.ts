// ============================================================
// Activity Log Routes
// ============================================================

import { Router } from 'express';
import * as activityController from '../controllers/activity.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', activityController.listActivityLogs);
router.get('/actions', activityController.getDistinctActions);
router.get('/:id', activityController.getActivityLog);

export default router;

