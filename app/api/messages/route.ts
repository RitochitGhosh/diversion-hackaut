import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/messages?serviceId=xxx&cursor=xxx&limit=30
 *
 * Returns the authenticated user's conversation history as grouped pairs
 * { queryId, question: Message, answer: Message | null, serviceName, serviceCode }
 * sorted newest-first. Pass `cursor` (the createdAt of the last question seen)
 * for simple pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.sub as string;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId') ?? undefined;
    const cursor = searchParams.get('cursor') ?? undefined;
    const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50);

    // Fetch all USER-role messages for this user (one per query = one question)
    const userMessages = await db.message.findMany({
      where: {
        userId,
        role: 'USER',
        ...(serviceId ? { serviceId } : {}),
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      include: {
        service: { select: { id: true, name: true, serviceCode: true, logoEmoji: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    if (userMessages.length === 0) {
      return NextResponse.json({ conversations: [], nextCursor: null });
    }

    // Batch-fetch the corresponding ASSISTANT messages by queryId
    const queryIds = userMessages.map((m) => m.queryId).filter(Boolean) as string[];
    const assistantMessages = await db.message.findMany({
      where: { queryId: { in: queryIds }, role: 'ASSISTANT' },
    });
    const answerByQueryId = new Map(assistantMessages.map((m) => [m.queryId, m]));

    const conversations = userMessages.map((question) => ({
      queryId: question.queryId,
      service: question.service,
      question: {
        id: question.id,
        content: question.content,
        createdAt: question.createdAt,
      },
      answer: question.queryId
        ? (answerByQueryId.get(question.queryId)
          ? {
              id: answerByQueryId.get(question.queryId)!.id,
              content: answerByQueryId.get(question.queryId)!.content,
              createdAt: answerByQueryId.get(question.queryId)!.createdAt,
            }
          : null)
        : null,
    }));

    const nextCursor =
      userMessages.length === limit
        ? userMessages[userMessages.length - 1].createdAt.toISOString()
        : null;

    return NextResponse.json({ conversations, nextCursor });
  } catch (error) {
    console.error('[GET /api/messages]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
