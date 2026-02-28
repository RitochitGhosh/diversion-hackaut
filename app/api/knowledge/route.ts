import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chunkText, embedChunks, storeChunks } from '@/lib/rag';

export const dynamic = 'force-dynamic';

// POST /api/knowledge — upload a document (ADMIN/REVIEWER only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sub: userId } = session.user;
    const contentType = request.headers.get('content-type') ?? '';
    let title = '';
    let content = '';
    let fileName: string | null = null;
    let serviceId = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      serviceId = formData.get('serviceId') as string;
      title = (formData.get('title') as string) || 'Untitled Document';
      const file = formData.get('file') as File | null;
      const textContent = formData.get('content') as string | null;

      if (file) {
        fileName = file.name;
        content = await file.text();
        if (!title || title === 'Untitled Document') title = file.name;
      } else if (textContent) {
        content = textContent;
      }
    } else {
      const body = await request.json();
      serviceId = body.serviceId;
      title = body.title || 'Untitled Document';
      content = body.content ?? '';
      fileName = body.fileName ?? null;
    }

    if (!serviceId) return NextResponse.json({ error: 'serviceId is required' }, { status: 400 });
    if (!content.trim()) return NextResponse.json({ error: 'Document content is required' }, { status: 400 });

    // Only ADMIN and REVIEWER can upload knowledge
    const member = await db.serviceMember.findUnique({
      where: { userId_serviceId: { userId, serviceId } },
    });
    if (!member || member.role === 'USER') {
      return NextResponse.json({ error: 'Only admins and reviewers can manage knowledge base' }, { status: 403 });
    }

    // Chunk and embed
    const chunks = chunkText(content.trim());
    if (chunks.length === 0) {
      return NextResponse.json({ error: 'Document is too short to process' }, { status: 400 });
    }

    let embeddings: number[][];
    try {
      embeddings = await embedChunks(chunks);
    } catch (e) {
      console.error('[Embedding error]', e);
      return NextResponse.json({ error: 'Failed to generate embeddings. Check your Google AI API key.' }, { status: 500 });
    }

    // Save document first, then store chunks with pgvector embeddings
    const doc = await db.knowledgeDocument.create({
      data: {
        title: title.trim(),
        fileName,
        content: content.trim(),
        chunkCount: chunks.length,
        serviceId,
        uploadedById: member.id,
      },
    });

    try {
      await storeChunks(doc.id, chunks, embeddings);
    } catch (chunkError) {
      // Clean up document if chunk storage fails
      await db.knowledgeDocument.delete({ where: { id: doc.id } });
      throw chunkError;
    }

    return NextResponse.json({ document: { ...doc, chunkCount: chunks.length } }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/knowledge]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/knowledge?serviceId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sub: userId } = session.user;
    const serviceId = new URL(request.url).searchParams.get('serviceId');
    if (!serviceId) return NextResponse.json({ error: 'serviceId required' }, { status: 400 });

    const member = await db.serviceMember.findUnique({
      where: { userId_serviceId: { userId, serviceId } },
    });
    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const documents = await db.knowledgeDocument.findMany({
      where: { serviceId },
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('[GET /api/knowledge]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
