import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/service-page/[serviceCode]
// Public endpoint — returns service info. If authenticated, auto-enrolls as USER and returns membership.
export async function GET(
  _request: NextRequest,
  { params }: { params: { serviceCode: string } }
) {
  try {
    const service = await db.service.findUnique({
      where: { serviceCode: params.serviceCode.toUpperCase() },
      select: {
        id: true,
        serviceCode: true,
        name: true,
        description: true,
        logoEmoji: true,
        createdAt: true,
        _count: { select: { members: true, queries: true } },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Try to get session — not required for this endpoint
    let membership = null;
    const session = await getSession();

    if (session?.user) {
      const { sub: userId, email, name, picture } = session.user;

      // Check existing membership
      const existing = await db.serviceMember.findUnique({
        where: { userId_serviceId: { userId, serviceId: service.id } },
      });

      if (existing) {
        membership = existing;
      } else {
        // Auto-enroll as USER
        membership = await db.serviceMember.create({
          data: {
            userId,
            email,
            name: name ?? null,
            avatarUrl: picture ?? null,
            role: 'USER',
            serviceId: service.id,
          },
        });
      }
    }

    return NextResponse.json({ service, membership });
  } catch (error) {
    console.error('[GET /api/service-page/[serviceCode]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
