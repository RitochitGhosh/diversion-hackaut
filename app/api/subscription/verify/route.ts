import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAlgoPayment } from '@/lib/algorand';
import { PLAN_PRICE_ALGO, PLAN_DURATION_DAYS } from '@/lib/subscription';
import type { SubscriptionTier } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

// POST /api/subscription/verify
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sub: userId } = session.user;
    const body = await request.json();
    const { serviceId, tier, txId, walletAddress } = body as {
      serviceId: string;
      tier: string;
      txId: string;
      walletAddress?: string;
    };

    if (!serviceId || !tier || !txId?.trim()) {
      return NextResponse.json({ error: 'serviceId, tier, and txId are required' }, { status: 400 });
    }

    if (tier !== 'PRO') {
      return NextResponse.json({ error: 'Invalid tier. Must be PRO' }, { status: 400 });
    }

    const member = await db.serviceMember.findUnique({
      where: { userId_serviceId: { userId, serviceId } },
    });
    if (!member || member.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can manage subscription' }, { status: 403 });
    }

    // Prevent reuse of same tx across any service
    const alreadyUsed = await db.subscription.findFirst({
      where: { algoTxId: txId.trim() },
    });
    if (alreadyUsed) {
      return NextResponse.json({ error: 'This transaction ID has already been used to activate a subscription' }, { status: 400 });
    }

    const receiverAddress = process.env.ALGORAND_RECEIVER_ADDRESS;
    if (!receiverAddress) {
      return NextResponse.json({ error: 'Algorand receiver address not configured' }, { status: 500 });
    }

    const expectedAlgo = PLAN_PRICE_ALGO;
    const verification = await verifyAlgoPayment(txId.trim(), expectedAlgo, receiverAddress);

    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: 400 });
    }

    // Activate subscription — 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + PLAN_DURATION_DAYS);

    const subscription = await db.subscription.upsert({
      where: { serviceId },
      create: {
        serviceId,
        tier: tier as SubscriptionTier,
        algoTxId: txId.trim(),
        walletAddress: walletAddress || verification.sender,
        expiresAt,
      },
      update: {
        tier: tier as SubscriptionTier,
        algoTxId: txId.trim(),
        walletAddress: walletAddress || verification.sender,
        expiresAt,
      },
    });

    return NextResponse.json({
      subscription,
      message: `Successfully upgraded to ${tier}! Your subscription is active for 30 days.`,
    });
  } catch (error) {
    console.error('[POST /api/subscription/verify]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
