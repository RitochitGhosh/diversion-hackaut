import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import { db } from './db';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export interface RagChunk {
  id: string;
  content: string;
  documentTitle: string;
  score: number;
}

// ─── Text Chunking ────────────────────────────────────────────────────────────

export function chunkText(text: string, chunkSize = 600, overlap = 80): string[] {
  const chunks: string[] = [];
  const normalized = text.replace(/\r\n/g, '\n').trim();
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);

    if (end < normalized.length) {
      const breakPoints = [
        normalized.lastIndexOf('\n\n', end),
        normalized.lastIndexOf('.\n', end),
        normalized.lastIndexOf('. ', end),
        normalized.lastIndexOf('\n', end),
      ];
      const best = Math.max(...breakPoints);
      if (best > start + chunkSize * 0.5) end = best + 1;
    }

    const chunk = normalized.slice(start, end).trim();
    if (chunk.length > 30) chunks.push(chunk);

    // We've consumed through the end of the text — stop to avoid an infinite loop
    // where `start = end - overlap` stays below `normalized.length` forever.
    if (end >= normalized.length) break;

    start = end - overlap;
    if (start <= 0) break;
  }

  return chunks;
}

// ─── Embeddings ───────────────────────────────────────────────────────────────

export async function embedText(
  text: string,
  taskType: TaskType = TaskType.RETRIEVAL_DOCUMENT
): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' }); // TODO: Add in .env
  const result = await model.embedContent({
    content: { role: 'user', parts: [{ text: text.slice(0, 2048) }] },
    taskType,
    outputDimensionality: 768,
  });
  return result.embedding.values;
}

// Embed chunks in batches of 5 to respect rate limits
export async function embedChunks(chunks: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchEmbeddings = await Promise.all(batch.map((c) => embedText(c)));
    embeddings.push(...batchEmbeddings);

    if (i + BATCH_SIZE < chunks.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return embeddings;
}

// ─── pgvector Storage ────────────────────────────────────────────────────────

/**
 * Store chunks with their embeddings using pgvector.
 * Uses raw SQL because Prisma can't set Unsupported("vector") fields via ORM.
 */
export async function storeChunks(
  documentId: string,
  chunks: string[],
  embeddings: number[][]
): Promise<void> {
  for (let i = 0; i < chunks.length; i++) {
    const id = crypto.randomUUID();
    const vectorLiteral = `[${embeddings[i].join(',')}]`;
    await db.$executeRawUnsafe(
      `INSERT INTO "KnowledgeChunk" (id, content, embedding, "chunkIndex", "documentId")
       VALUES ($1, $2, $3::vector, $4, $5)`,
      id,
      chunks[i],
      vectorLiteral,
      i,
      documentId
    );
  }
}

// ─── pgvector Retrieval ───────────────────────────────────────────────────────

type ChunkRow = { id: string; content: string; title: string; score: number };

/**
 * Find relevant chunks using pgvector cosine similarity (<=> operator).
 * Falls back to keyword search if no embedding results found.
 */
export async function findRelevantChunks(
  query: string,
  serviceId: string,
  topK = 5,
  minScore = 0.15
): Promise<RagChunk[]> {
  // 1. Try pgvector similarity search
  try {
    const queryEmbedding = await embedText(query, TaskType.RETRIEVAL_QUERY);
    const vectorLiteral = `[${queryEmbedding.join(',')}]`;

    const rows = await db.$queryRawUnsafe<ChunkRow[]>(
      `SELECT kc.id, kc.content, kd.title,
              1 - (kc.embedding <=> $1::vector) AS score
       FROM "KnowledgeChunk" kc
       JOIN "KnowledgeDocument" kd ON kc."documentId" = kd.id
       WHERE kd."serviceId" = $2
         AND kc.embedding IS NOT NULL
         AND 1 - (kc.embedding <=> $1::vector) >= $3
       ORDER BY kc.embedding <=> $1::vector
       LIMIT $4`,
      vectorLiteral,
      serviceId,
      minScore,
      topK
    );

    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        content: r.content,
        documentTitle: r.title,
        score: Number(r.score),
      }));
    }
  } catch (e) {
    console.error('[RAG] pgvector search failed, trying keyword fallback:', e);
  }

  // 2. Keyword fallback — PostgreSQL full-text search
  try {
    const keywords = query.split(/\s+/).filter((w) => w.length > 2).slice(0, 8);
    if (keywords.length === 0) return [];

    const tsQuery = keywords.map((w) => `${w}:*`).join(' & ');
    const rows = await db.$queryRawUnsafe<ChunkRow[]>(
      `SELECT kc.id, kc.content, kd.title,
              ts_rank(to_tsvector('english', kc.content), to_tsquery('english', $1)) AS score
       FROM "KnowledgeChunk" kc
       JOIN "KnowledgeDocument" kd ON kc."documentId" = kd.id
       WHERE kd."serviceId" = $2
         AND to_tsvector('english', kc.content) @@ to_tsquery('english', $1)
       ORDER BY score DESC
       LIMIT $3`,
      tsQuery,
      serviceId,
      topK
    );

    return rows.map((r) => ({
      id: r.id,
      content: r.content,
      documentTitle: r.title,
      score: Number(r.score),
    }));
  } catch (e) {
    console.error('[RAG] Keyword fallback also failed:', e);
    return [];
  }
}
