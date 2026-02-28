import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// DELETE /api/knowledge/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sub: userId } = session.user;
    const doc = await db.knowledgeDocument.findUnique({
      where: { id: params.id },
    });
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    // Only ADMIN/REVIEWER can delete
    const member = await db.serviceMember.findUnique({
      where: { userId_serviceId: { userId, serviceId: doc.serviceId } },
    });
    if (!member || member.role === 'USER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cascades to KnowledgeChunk via schema
    await db.knowledgeDocument.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/knowledge/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
