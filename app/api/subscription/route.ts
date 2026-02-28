import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/subscription?serviceId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sub: userId } = session.user;
    const serviceId = new URL(request.url).searchParams.get('serviceId');
    if (!serviceId) return NextResponse.json({ error: 'serviceId required' }, { status: 400 });

    const member = await db.serviceMember.findUnique({
      where: { userId_serviceId: { userId, serviceId } },
    });
    if (!member || member.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can view subscription' }, { status: 403 });
    }

    // Get or create subscription (auto-create FREE for new services)
    let subscription = await db.subscription.findUnique({ where: { serviceId } });
    if (!subscription) {
      subscription = await db.subscription.create({
        data: { serviceId, tier: 'FREE' },
      });
    }

    // Check if PRO/ENTERPRISE has expired — downgrade to FREE
    if (subscription.tier !== 'FREE' && subscription.expiresAt && subscription.expiresAt < new Date()) {
      subscription = await db.subscription.update({
        where: { serviceId },
        data: { tier: 'FREE', algoTxId: null, walletAddress: null, expiresAt: null },
      });
    }

    // Usage stats for this service this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [queriesThisMonth, knowledgeDocCount] = await Promise.all([
      db.query.count({ where: { serviceId, createdAt: { gte: startOfMonth } } }),
      db.knowledgeDocument.count({ where: { serviceId } }),
    ]);

    return NextResponse.json({ subscription, queriesThisMonth, knowledgeDocCount });
  } catch (error) {
    console.error('[GET /api/subscription]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
