import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserPlan, countOwnedServices, getPlans } from '@/lib/plans';

export const dynamic = 'force-dynamic';

// GET /api/billing — returns the current user's plan and usage stats
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.sub as string;
    const plan = await getUserPlan(userId);
    const subscription = await db.userSubscription.findUnique({ where: { userId } });
    const ownedServices = await countOwnedServices(userId);

    return NextResponse.json({
      plan,
      subscription: subscription ?? null,
      ownedServices,
      plans: getPlans(),
    });
  } catch (error) {
    console.error('[GET /api/billing]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
