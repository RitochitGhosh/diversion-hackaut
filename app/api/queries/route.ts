import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateInitialDraftWithAgent } from '@/lib/genai';

export const dynamic = 'force-dynamic';

// POST /api/queries - submit a new query (all roles)
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

    const member = await db.serviceMember.findUnique({
      where: { userId_serviceId: { userId, serviceId } },
      include: { service: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'You are not a member of this service' }, { status: 403 });
    }

    // Create query
    const query = await db.query.create({
      data: {
        content: content.trim(),
        submitterId: member.id,
        serviceId,
        status: 'PENDING_AI',
      },
    });

    // Run agent pipeline
    try {
      const agentResult = await generateInitialDraftWithAgent(
        content.trim(),
        member.service.name,
        serviceId
      );

      const updated = await db.query.update({
        where: { id: query.id },
        data: {
          aiDraft: agentResult.draft,
          status: 'PENDING_REVIEW',
          sources: agentResult.sources as any,
          agentLog: agentResult.agentLog as any,
        },
      });

      return NextResponse.json({ query: updated }, { status: 201 });
    } catch (aiError) {
      console.error('[Agent Pipeline Error]', aiError);
      await db.query.update({
        where: { id: query.id },
        data: {
          aiDraft: 'AI generation encountered an error. Reviewer can provide manual response.',
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

// GET /api/queries?serviceId=xxx&status=xxx&mine=true
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

    const member = await db.serviceMember.findUnique({
      where: { userId_serviceId: { userId, serviceId } },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // USER role can only see their own queries
    const forceOwn = member.role === 'USER';
    const where: Record<string, unknown> = { serviceId };
    if (status) where.status = status;
    if (mine || forceOwn) where.submitterId = member.id;

    const queries = await db.query.findMany({
      where,
      include: {
        submitter: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
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
