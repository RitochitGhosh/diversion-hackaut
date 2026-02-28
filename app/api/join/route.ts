import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserPlan, countReviewers } from '@/lib/plans';

export const dynamic = 'force-dynamic';

// POST /api/join - join a service as reviewer using service code
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sub: userId, email, name, picture } = session.user;
    const body = await request.json();
    const { serviceCode } = body;

    if (!serviceCode?.trim()) {
      return NextResponse.json({ error: 'Service code is required' }, { status: 400 });
    }

    const service = await db.service.findUnique({
      where: { serviceCode: serviceCode.trim().toUpperCase() },
    });

    if (!service) {
      return NextResponse.json({ error: 'Invalid service code. Please check and try again.' }, { status: 404 });
    }

    // Check if already a member
    const existing = await db.serviceMember.findUnique({
      where: { userId_serviceId: { userId, serviceId: service.id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You are already a member of this service.', membership: existing },
        { status: 409 }
      );
    }

    // --- Plan limit: max reviewers per service ---
    const ownerPlan = await getUserPlan(service.ownerId);
    if (ownerPlan.maxReviewers !== Infinity) {
      const reviewerCount = await countReviewers(service.id);
      if (reviewerCount >= ownerPlan.maxReviewers) {
        return NextResponse.json(
          {
            error: `This service has reached its reviewer limit (${ownerPlan.maxReviewers} on the ${ownerPlan.label} plan). The service owner must upgrade to add more reviewers.`,
          },
          { status: 403 }
        );
      }
    }

    // Can't join your own service as a reviewer (already admin)
    if (service.ownerId === userId) {
      return NextResponse.json(
        { error: 'You are the owner of this service and already have ADMIN access.' },
        { status: 409 }
      );
    }

    const membership = await db.serviceMember.create({
      data: {
        userId,
        email,
        name: name ?? null,
        avatarUrl: picture ?? null,
        role: 'REVIEWER',
        serviceId: service.id,
      },
      include: { service: true },
    });

    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/join]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
