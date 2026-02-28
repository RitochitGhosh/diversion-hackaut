import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateServiceCode } from '@/lib/utils';
import { getUserPlan, countOwnedServices } from '@/lib/plans';

export const dynamic = 'force-dynamic';

// POST /api/services - create a new service
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sub: userId, email, name, picture } = session.user;
    const body = await request.json();
    const { serviceName, description, logoEmoji } = body;

    if (!serviceName?.trim()) {
      return NextResponse.json({ error: 'Service name is required' }, { status: 400 });
    }

    // --- Plan limit: max services per user ---
    const plan = await getUserPlan(userId);
    if (plan.maxServices !== Infinity) {
      const owned = await countOwnedServices(userId);
      if (owned >= plan.maxServices) {
        return NextResponse.json(
          {
            error: `Your ${plan.label} plan allows a maximum of ${plan.maxServices} service${plan.maxServices > 1 ? 's' : ''}. Upgrade your plan to create more.`,
            upgradeRequired: true,
          },
          { status: 403 }
        );
      }
    }

    const serviceCode = generateServiceCode();

    const service = await db.service.create({
      data: {
        serviceCode,
        name: serviceName.trim(),
        description: description?.trim() || null,
        logoEmoji: logoEmoji || '🏢',
        ownerId: userId,
        members: {
          create: {
            userId,
            email,
            name: name ?? null,
            avatarUrl: picture ?? null,
            role: 'ADMIN',
          },
        },
      },
      include: {
        _count: { select: { members: true, queries: true } },
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/services]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/services - get user's services
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sub: userId } = session.user;

    const memberships = await db.serviceMember.findMany({
      where: { userId },
      include: {
        service: {
          include: {
            _count: { select: { members: true, queries: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ memberships });
  } catch (error) {
    console.error('[GET /api/services]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
