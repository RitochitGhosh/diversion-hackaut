import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateDetailedAnswer } from '@/lib/genai';

export const dynamic = 'force-dynamic';

// POST /api/queries/[id]/review - reviewer submits their decision
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
      return NextResponse.json({ error: 'Edited content is required when action is EDITED' }, { status: 400 });
    }

    // Fetch query with service info
    const query = await db.query.findUnique({
      where: { id: queryId },
      include: {
        service: true,
        review: true,
      },
    });

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    if (query.status !== 'PENDING_REVIEW') {
      return NextResponse.json({ error: 'This query is not pending review' }, { status: 409 });
    }

    // Verify reviewer is a member
    const reviewer = await db.serviceMember.findUnique({
      where: { userId_serviceId: { userId, serviceId: query.serviceId } },
    });

    if (!reviewer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Save review
    const review = await db.review.create({
      data: {
        action,
        editedContent: action === 'EDITED' ? editedContent.trim() : null,
        note: note?.trim() || null,
        reviewerId: reviewer.id,
        queryId,
      },
    });

    // Update query status
    const newStatus = action === 'REJECTED' ? 'REJECTED' : action === 'EDITED' ? 'EDITED' : 'APPROVED';
    await db.query.update({ where: { id: queryId }, data: { status: newStatus } });

    // If approved or edited, generate detailed final answer
    if (action !== 'REJECTED') {
      const contentToUse =
        action === 'EDITED' ? editedContent.trim() : (query.aiDraft ?? query.content);

      try {
        const finalAnswer = await generateDetailedAnswer(
          query.content,
          contentToUse,
          note ?? null,
          query.service.name
        );

        await db.query.update({
          where: { id: queryId },
          data: { finalAnswer, status: 'ANSWERED' },
        });

        return NextResponse.json({ review, status: 'ANSWERED', finalAnswer });
      } catch (aiError) {
        console.error('[Final AI Error]', aiError);
        // Still mark as reviewed even if final AI fails
        return NextResponse.json({ review, status: newStatus, finalAnswer: null });
      }
    }

    return NextResponse.json({ review, status: 'REJECTED' });
  } catch (error) {
    console.error('[POST /api/queries/[id]/review]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
