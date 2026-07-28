// ============================================================
// Policy Configuration Controller
// ============================================================

import { Request, Response } from 'express';
import { policyService } from '../services';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/helpers';

export const listPolicies = asyncHandler(async (_req: Request, res: Response) => {
  const policies = await policyService.listPolicies();
  sendSuccess(res, policies);
});

export const getPolicy = asyncHandler(async (req: Request, res: Response) => {
  const policy = await policyService.getPolicyByKey(req.params.key);
  sendSuccess(res, policy);
});

export const upsertPolicy = asyncHandler(async (req: Request, res: Response) => {
  const { key, value, description } = req.body;
  const policy = await policyService.upsertPolicy(key, value, description);
  sendSuccess(res, policy, 'Policy updated successfully');
});

export const deletePolicy = asyncHandler(async (req: Request, res: Response) => {
  await policyService.deletePolicy(req.params.key);
  sendSuccess(res, null, 'Policy deleted successfully');
});

