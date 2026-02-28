import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/notifications/read-all — mark every unread notification as read for the current user
export async function POST() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.notification.updateMany({
      where: { userId: session.user.sub, read: false },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/notifications/read-all]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
