// ============================================================
// Policy Configuration Routes (LIBRARIAN only)
// ============================================================

import { Router } from 'express';
import * as policyController from '../controllers/policy.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('LIBRARIAN'));

router.get('/', policyController.listPolicies);
router.get('/:key', policyController.getPolicy);
router.put('/', policyController.upsertPolicy);
router.delete('/:key', policyController.deletePolicy);

export default router;

