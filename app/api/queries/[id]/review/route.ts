import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateDetailedAnswer } from '@/lib/genai';
import type { Source } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sub: userId } = session.user;
    const { id: queryId } = params;
    const body = await request.json();
    const { action, editedContent, note } = body;

    if (!['APPROVED', 'EDITED', 'REJECTED'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    if (action === 'EDITED' && !editedContent?.trim()) {
      return NextResponse.json({ error: 'Edited content is required' }, { status: 400 });
    }

    const query = await db.query.findUnique({
      where: { id: queryId },
      include: { service: true, review: true },
    });

    if (!query) return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    if (query.status !== 'PENDING_REVIEW') {
      return NextResponse.json({ error: 'Query is not pending review' }, { status: 409 });
    }

    // Only ADMIN and REVIEWER can review — USER cannot
    const reviewer = await db.serviceMember.findUnique({
      where: { userId_serviceId: { userId, serviceId: query.serviceId } },
    });

    if (!reviewer || reviewer.role === 'USER') {
      return NextResponse.json({ error: 'Only reviewers can review queries' }, { status: 403 });
    }

    const review = await db.review.create({
      data: {
        action,
        editedContent: action === 'EDITED' ? editedContent.trim() : null,
        note: note?.trim() || null,
        reviewerId: reviewer.id,
        queryId,
      },
    });

    const newStatus = action === 'REJECTED' ? 'REJECTED' : action === 'EDITED' ? 'EDITED' : 'APPROVED';
    await db.query.update({ where: { id: queryId }, data: { status: newStatus } });

    if (action !== 'REJECTED') {
      const contentToUse = action === 'EDITED' ? editedContent.trim() : (query.aiDraft ?? query.content);
      const sources = (query.sources as Source[] | null) ?? [];

      try {
        const finalAnswer = await generateDetailedAnswer(
          query.content,
          contentToUse,
          note ?? null,
          query.service.name,
          sources
        );
        await db.query.update({ where: { id: queryId }, data: { finalAnswer, status: 'ANSWERED' } });
        return NextResponse.json({ review, status: 'ANSWERED', finalAnswer });
      } catch (aiError) {
        console.error('[Final AI Error]', aiError);
        return NextResponse.json({ review, status: newStatus, finalAnswer: null });
      }
    }

    return NextResponse.json({ review, status: 'REJECTED' });
  } catch (error) {
    console.error('[POST /api/queries/[id]/review]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
