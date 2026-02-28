import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyWebhookSignature, parseLsSubscription } from '@/lib/lemonsqueezy';
import { PLANS } from '@/lib/plans';

export const dynamic = 'force-dynamic';

const PLAN_BY_VARIANT: Record<string, 'PRO' | 'ENTERPRISE'> = {};
// Populated at startup (variant IDs come from env)
if (process.env.LEMONSQUEEZY_PRO_VARIANT_ID) {
  PLAN_BY_VARIANT[process.env.LEMONSQUEEZY_PRO_VARIANT_ID] = 'PRO';
}
if (process.env.LEMONSQUEEZY_ENTERPRISE_VARIANT_ID) {
  PLAN_BY_VARIANT[process.env.LEMONSQUEEZY_ENTERPRISE_VARIANT_ID] = 'ENTERPRISE';
}

// POST /api/lemonsqueezy/webhook — receives and processes LemonSqueezy events
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-signature') ?? '';

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('[LS Webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventName: string = payload.meta?.event_name ?? '';
  console.log('[LS Webhook] Event:', eventName);

  const sub = parseLsSubscription(payload);
  if (!sub) {
    return NextResponse.json({ received: true }); // not a subscription event we can process
  }

  const plan = PLAN_BY_VARIANT[sub.variantId] ?? 'FREE';

  switch (eventName) {
    case 'subscription_created':
    case 'subscription_updated':
    case 'subscription_resumed': {
      const newStatus = sub.status === 'active' ? 'active' : sub.status;
      await db.userSubscription.upsert({
        where: { userId: sub.userId },
        create: {
          userId: sub.userId,
          plan: sub.status === 'active' ? plan : 'FREE',
          lsSubscriptionId: sub.lsSubscriptionId,
          lsCustomerId: sub.lsCustomerId,
          lsOrderId: sub.lsOrderId,
          status: newStatus,
          currentPeriodEnd: sub.currentPeriodEnd,
        },
        update: {
          plan: sub.status === 'active' ? plan : 'FREE',
          lsSubscriptionId: sub.lsSubscriptionId,
          lsCustomerId: sub.lsCustomerId,
          status: newStatus,
          currentPeriodEnd: sub.currentPeriodEnd,
        },
      });
      break;
    }

    case 'subscription_cancelled': {
      await db.userSubscription.updateMany({
        where: { lsSubscriptionId: sub.lsSubscriptionId },
        data: { status: 'cancelled', currentPeriodEnd: sub.currentPeriodEnd },
      });
      break;
    }

    case 'subscription_expired': {
      await db.userSubscription.updateMany({
        where: { lsSubscriptionId: sub.lsSubscriptionId },
        data: { plan: 'FREE', status: 'expired', lsSubscriptionId: null },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
