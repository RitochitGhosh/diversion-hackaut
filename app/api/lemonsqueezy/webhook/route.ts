import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyWebhookSignature, parseLsSubscription } from '@/lib/lemonsqueezy';

export const dynamic = 'force-dynamic';

// POST /api/lemonsqueezy/webhook — receives and processes LemonSqueezy events
export async function POST(request: NextRequest) {
  const rawBody   = await request.text();
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
    console.warn('[LS Webhook] Could not parse subscription — missing user_id?');
    return NextResponse.json({ received: true });
  }

  // Read at request-time so Vercel env vars are always current
  const proVariantId = process.env.LEMONSQUEEZY_PRO_VARIANT_ID ?? '';
  const resolvedPlan = sub.variantId === proVariantId ? 'PRO' : 'FREE';

  switch (eventName) {
    // ── Subscription activated / renewed ─────────────────────────────────────
    case 'subscription_created':
    case 'subscription_updated': {
      const plan = sub.status === 'active' ? resolvedPlan : 'FREE';
      await db.userSubscription.upsert({
        where:  { userId: sub.userId },
        create: {
          userId:           sub.userId,
          plan,
          lsSubscriptionId: sub.lsSubscriptionId,
          lsCustomerId:     sub.lsCustomerId,
          lsOrderId:        sub.lsOrderId,
          status:           sub.status,
          currentPeriodEnd: sub.currentPeriodEnd,
        },
        update: {
          plan,
          lsSubscriptionId: sub.lsSubscriptionId,
          lsCustomerId:     sub.lsCustomerId,
          status:           sub.status,
          currentPeriodEnd: sub.currentPeriodEnd,
        },
      });
      break;
    }

    // ── User un-cancelled (resumed) — restore full access ─────────────────────
    case 'subscription_resumed': {
      // LS sends status: 'active' when resumed; renews_at is set again
      await db.userSubscription.upsert({
        where:  { userId: sub.userId },
        create: {
          userId:           sub.userId,
          plan:             resolvedPlan,
          lsSubscriptionId: sub.lsSubscriptionId,
          lsCustomerId:     sub.lsCustomerId,
          lsOrderId:        sub.lsOrderId,
          status:           'active',
          currentPeriodEnd: sub.currentPeriodEnd,
        },
        update: {
          plan:             resolvedPlan,   // restore PRO
          status:           'active',       // clear 'cancelled'
          currentPeriodEnd: sub.currentPeriodEnd,
        },
      });
      break;
    }

    // ── User cancelled — keep plan active until period ends ───────────────────
    case 'subscription_cancelled': {
      // Do NOT downgrade plan here; getUserPlan() downgrades after currentPeriodEnd passes.
      // Use userId (always present after parseLsSubscription) so we never miss the row.
      await db.userSubscription.upsert({
        where:  { userId: sub.userId },
        create: {
          userId:           sub.userId,
          plan:             resolvedPlan,
          lsSubscriptionId: sub.lsSubscriptionId,
          lsCustomerId:     sub.lsCustomerId,
          lsOrderId:        sub.lsOrderId,
          status:           'cancelled',
          currentPeriodEnd: sub.currentPeriodEnd, // ends_at from LS
        },
        update: {
          status:           'cancelled',
          currentPeriodEnd: sub.currentPeriodEnd, // when access truly ends
        },
      });
      break;
    }

    // ── Period ended after cancellation ───────────────────────────────────────
    case 'subscription_expired': {
      await db.userSubscription.updateMany({
        where: { lsSubscriptionId: sub.lsSubscriptionId },
        data:  { plan: 'FREE', status: 'expired', lsSubscriptionId: null },
      });
      break;
    }

    default:
      console.log('[LS Webhook] Unhandled event (no-op):', eventName);
      break;
  }

  return NextResponse.json({ received: true });
}
