import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { createCheckout, createCustomerPortal } from '@/lib/lemonsqueezy';
import { PLANS, getUserPlan } from '@/lib/plans';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/lemonsqueezy/checkout — { plan: 'PRO' | 'ENTERPRISE' } → redirects to checkout
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sub: userId, email } = session.user;
    const { plan: planId } = await request.json();

    if (!planId || planId === 'FREE') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const plan = PLANS[planId as 'PRO' | 'ENTERPRISE'];
    if (!plan || !plan.lsVariantId) {
      return NextResponse.json({ error: 'Plan not configured' }, { status: 400 });
    }

    // If user already has a paid subscription, return customer portal URL
    const existing = await db.userSubscription.findUnique({ where: { userId } });
    if (existing?.lsCustomerId && existing.plan !== 'FREE') {
      const portalUrl = await createCustomerPortal(existing.lsCustomerId);
      return NextResponse.json({ url: portalUrl, type: 'portal' });
    }

    const checkoutUrl = await createCheckout(plan.lsVariantId, userId, email ?? '');
    return NextResponse.json({ url: checkoutUrl, type: 'checkout' });
  } catch (error) {
    console.error('[POST /api/lemonsqueezy/checkout]', error);
    const msg = error instanceof Error ? error.message : 'Failed to create checkout';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
