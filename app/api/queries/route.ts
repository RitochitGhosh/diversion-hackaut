import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateInitialDraftWithAgent } from '@/lib/genai';
import { publishNotification } from '@/lib/rabbitmq';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import { getUserPlan, countQueriesThisMonth } from '@/lib/plans';

export const dynamic = 'force-dynamic';

const MIN_QUERY_LENGTH = 20;

// POST /api/queries - submit a new query (all roles)
export async function POST(request: NextRequest) {
  try {
    // --- IP Rate Limiting ---
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateLimit.retryAfter}s before submitting again.` },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfter) },
        }
      );
    }

    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sub: userId } = session.user;
    const body = await request.json();
    const { content, serviceId, imageUrls = [] } = body;

    // --- Content Validation ---
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Query content is required' }, { status: 400 });
    }
    if (content.trim().length < MIN_QUERY_LENGTH) {
      return NextResponse.json(
        { error: `Query must be at least ${MIN_QUERY_LENGTH} characters long. Please provide more detail.` },
        { status: 400 }
      );
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

    // --- Plan limit: queries per month ---
    const serviceOwner = await db.service.findUnique({
      where: { id: serviceId },
      select: { ownerId: true },
    });
    if (serviceOwner) {
      const ownerPlan = await getUserPlan(serviceOwner.ownerId);
      if (ownerPlan.maxQueriesPerMonth !== Infinity) {
        const used = await countQueriesThisMonth(serviceId);
        if (used >= ownerPlan.maxQueriesPerMonth) {
          return NextResponse.json(
            {
              error: `This service has reached its monthly query limit (${ownerPlan.maxQueriesPerMonth} on the ${ownerPlan.label} plan). The service owner must upgrade to continue.`,
            },
            { status: 429 }
          );
        }
      }
    }

    // Create query
    const validImageUrls = Array.isArray(imageUrls)
      ? (imageUrls as unknown[]).filter((u) => typeof u === 'string').slice(0, 3)
      : [];

    const query = await db.query.create({
      data: {
        content: content.trim(),
        submitterId: member.id,
        serviceId,
        status: 'PENDING_AI',
        imageUrls: validImageUrls.length ? validImageUrls : undefined,
      },
    });

    // Persist user message for conversation history
    await db.message.create({
      data: {
        role: 'USER',
        content: content.trim(),
        userId,
        serviceId,
        queryId: query.id,
      },
    });

    // Notify ADMIN and REVIEWER members that a new query needs review
    const privilegedMembers = await db.serviceMember.findMany({
      where: { serviceId, role: { in: ['ADMIN', 'REVIEWER'] } },
    });
    await Promise.all(
      privilegedMembers.map((m) =>
        publishNotification({
          userId: m.userId,
          type: 'QUERY_SUBMITTED',
          title: 'New query submitted',
          message: `${member.name ?? member.email} submitted a query: "${content.trim().slice(0, 60)}${content.trim().length > 60 ? '…' : ''}"`,
          queryId: query.id,
          serviceId,
        })
      )
    );

    // Run agent pipeline — augment content with image context for the AI
    const contentForAI =
      validImageUrls.length > 0
        ? `${content.trim()}\n\n[User has attached ${validImageUrls.length} image(s) for reference: ${validImageUrls.join(', ')}]`
        : content.trim();

    try {
      const agentResult = await generateInitialDraftWithAgent(
        contentForAI,
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

      // Notify reviewers that AI draft is ready
      await Promise.all(
        privilegedMembers.map((m) =>
          publishNotification({
            userId: m.userId,
            type: 'QUERY_PENDING_REVIEW',
            title: 'AI draft ready for review',
            message: `A query from ${member.name ?? member.email} has an AI draft waiting for your review.`,
            queryId: query.id,
            serviceId,
          })
        )
      );

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
