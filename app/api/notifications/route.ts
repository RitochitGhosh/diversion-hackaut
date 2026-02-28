import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/notifications — fetch the current user's 30 most recent notifications
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await db.notification.findMany({
      where: { userId: session.user.sub },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('[GET /api/notifications]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
