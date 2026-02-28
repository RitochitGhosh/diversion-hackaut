import { db } from './db';

export type PlanId = 'FREE' | 'PRO';

export interface Plan {
  id: PlanId;
  label: string;
  priceInr: number; // INR/month
  maxServices: number;
  maxReviewers: number;
  maxQueriesPerMonth: number;
  lsVariantId?: string;
}

export const PLANS: Record<PlanId, Plan> = {
  FREE: {
    id: 'FREE',
    label: 'Free',
    priceInr: 0,
    maxServices: 1,
    maxReviewers: 3,
    maxQueriesPerMonth: 10,
  },
  PRO: {
    id: 'PRO',
    label: 'Pro',
    priceInr: 499,
    maxServices: 10,
    maxReviewers: 50,
    maxQueriesPerMonth: 500,
    lsVariantId: process.env.LEMONSQUEEZY_PRO_VARIANT_ID,
  },
};

/** Get (or auto-create FREE) the UserSubscription for a user. */
export async function getUserPlan(userId: string): Promise<Plan> {
  const sub = await db.userSubscription.findUnique({ where: { userId } });
  if (!sub || sub.status === 'expired') return PLANS.FREE;

  // Downgrade if subscription period has ended
  if (sub.currentPeriodEnd && sub.currentPeriodEnd < new Date()) {
    await db.userSubscription.update({
      where: { userId },
      data: { plan: 'FREE', status: 'expired', lsSubscriptionId: null },
    });
    return PLANS.FREE;
  }

  return PLANS[sub.plan as PlanId] ?? PLANS.FREE;
}

/** Count services owned (ADMIN role) by a user. */
export async function countOwnedServices(userId: string): Promise<number> {
  return db.serviceMember.count({ where: { userId, role: 'ADMIN' } });
}

/** Count REVIEWER members for a service (excludes ADMINs). */
export async function countReviewers(serviceId: string): Promise<number> {
  return db.serviceMember.count({ where: { serviceId, role: 'REVIEWER' } });
}

/** Count queries submitted to a service this calendar month. */
export async function countQueriesThisMonth(serviceId: string): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return db.query.count({ where: { serviceId, createdAt: { gte: start } } });
}
