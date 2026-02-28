import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/user - get user's memberships
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sub: userId, email, name, picture } = session.user;

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

    // Auto-sync user profile on first call
    if (memberships.length > 0) {
      await db.serviceMember.updateMany({
        where: { userId, name: null },
        data: { name: name ?? null, avatarUrl: picture ?? null },
      });
    }

    return NextResponse.json({ memberships, userId, email, name, picture });
  } catch (error) {
    console.error('[GET /api/user]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
