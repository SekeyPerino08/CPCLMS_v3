// ============================================================
// Policy Configuration Service
// ============================================================

import { prisma } from '../config';
import { NotFoundError, ConflictError } from '../utils/errors';

export class PolicyService {
  /**
   * Get all policies
   */
  async listPolicies() {
    return prisma.policy.findMany({ orderBy: { key: 'asc' } });
  }

  /**
   * Get a single policy by key
   */
  async getPolicyByKey(key: string) {
    const policy = await prisma.policy.findUnique({ where: { key } });
    if (!policy) throw new NotFoundError(`Policy '${key}'`);
    return policy;
  }

  /**
   * Update or create a policy (upsert)
   */
  async upsertPolicy(key: string, value: string, description?: string) {
    const policy = await prisma.policy.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
    return policy;
  }

  /**
   * Delete a policy
   */
  async deletePolicy(key: string) {
    const policy = await prisma.policy.findUnique({ where: { key } });
    if (!policy) throw new NotFoundError(`Policy '${key}'`);

    await prisma.policy.delete({ where: { key } });
  }

  /**
   * Get a policy value as number with fallback
   */
  async getNumber(key: string, fallback: number): Promise<number> {
    const policy = await prisma.policy.findUnique({ where: { key } });
    if (!policy) return fallback;
    const parsed = parseInt(policy.value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Get a policy value as float with fallback
   */
  async getFloat(key: string, fallback: number): Promise<number> {
    const policy = await prisma.policy.findUnique({ where: { key } });
    if (!policy) return fallback;
    const parsed = parseFloat(policy.value);
    return isNaN(parsed) ? fallback : parsed;
  }
}

export const policyService = new PolicyService();

