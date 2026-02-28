import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/notifications/[id]/read — mark a single notification as read
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure the notification belongs to this user before updating
    const notification = await db.notification.findUnique({
      where: { id: params.id },
    });

    if (!notification || notification.userId !== session.user.sub) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db.notification.update({
      where: { id: params.id },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/notifications/[id]/read]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
