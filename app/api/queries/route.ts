import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateInitialDraft } from '@/lib/genai';

export const dynamic = 'force-dynamic';

// POST /api/queries - submit a new query
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sub: userId } = session.user;
    const body = await request.json();
    const { content, serviceId } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Query content is required' }, { status: 400 });
    }
    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    // Verify user is a member of this service
    const member = await db.serviceMember.findUnique({
      where: { userId_serviceId: { userId, serviceId } },
      include: { service: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'You are not a member of this service' }, { status: 403 });
    }

    // Create query record
    const query = await db.query.create({
      data: {
        content: content.trim(),
        submitterId: member.id,
        serviceId,
        status: 'PENDING_AI',
      },
    });

    // Generate AI draft (async in same request for simplicity)
    try {
      const aiDraft = await generateInitialDraft(content.trim(), member.service.name);
      await db.query.update({
        where: { id: query.id },
        data: { aiDraft, status: 'PENDING_REVIEW' },
      });
      return NextResponse.json({ query: { ...query, aiDraft, status: 'PENDING_REVIEW' } }, { status: 201 });
    } catch (aiError) {
      console.error('[AI Generation Error]', aiError);
      // Return query even if AI fails — reviewer can still handle manually
      await db.query.update({
        where: { id: query.id },
        data: {
          aiDraft: 'AI generation failed. Please provide a manual response.',
          status: 'PENDING_REVIEW',
        },
      });
      return NextResponse.json({ query: { ...query, status: 'PENDING_REVIEW' } }, { status: 201 });
    }
  } catch (error) {
    console.error('[POST /api/queries]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/queries?serviceId=xxx&status=xxx - list queries
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sub: userId } = session.user;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const status = searchParams.get('status');
    const mine = searchParams.get('mine') === 'true';

    if (!serviceId) {
      return NextResponse.json({ error: 'serviceId is required' }, { status: 400 });
    }

    // Verify membership
    const member = await db.serviceMember.findUnique({
      where: { userId_serviceId: { userId, serviceId } },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const where: Record<string, unknown> = { serviceId };
    if (status) where.status = status;
    if (mine) where.submitterId = member.id;

    const queries = await db.query.findMany({
      where,
      include: {
        submitter: { select: { id: true, name: true, email: true, avatarUrl: true } },
        review: {
          include: {
            reviewer: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ queries, memberId: member.id, role: member.role });
  } catch (error) {
    console.error('[GET /api/queries]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
