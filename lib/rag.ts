import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import { db } from './db';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export interface RagChunk {
  id: string;
  content: string;
  documentTitle: string;
  score: number;
}

// ─── Text Chunking ───────────────────────────────────────────────────────────

export function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  const normalized = text.replace(/\r\n/g, '\n').trim();
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);

    // Try to break at a sentence or paragraph boundary
    if (end < normalized.length) {
      const breakPoints = [
        normalized.lastIndexOf('\n\n', end),
        normalized.lastIndexOf('.\n', end),
        normalized.lastIndexOf('. ', end),
        normalized.lastIndexOf('\n', end),
      ];
      const best = Math.max(...breakPoints);
      if (best > start + chunkSize * 0.5) {
        end = best + 1;
      }
    }

    const chunk = normalized.slice(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk);

    start = end - overlap;
    if (start <= 0 || start >= normalized.length) break;
  }

  return chunks;
}

// ─── Embeddings ──────────────────────────────────────────────────────────────

export async function embedText(
  text: string,
  taskType: TaskType = TaskType.RETRIEVAL_DOCUMENT
): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent({
    content: { role: 'user', parts: [{ text: text.slice(0, 2048) }] },
    taskType,
  });
  return result.embedding.values;
}

// Embed chunks in small batches to avoid rate limits
export async function embedChunks(chunks: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchEmbeddings = await Promise.all(batch.map((c) => embedText(c)));
    embeddings.push(...batchEmbeddings);

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < chunks.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return embeddings;
}

// ─── Similarity Search ───────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ─── Retrieval ───────────────────────────────────────────────────────────────

export async function findRelevantChunks(
  query: string,
  serviceId: string,
  topK = 4,
  minScore = 0.25
): Promise<RagChunk[]> {
  // Load all chunks for this service (in-memory RAG)
  const chunks = await db.knowledgeChunk.findMany({
    where: { document: { serviceId } },
    include: { document: { select: { title: true } } },
  });

  if (chunks.length === 0) return [];

  // Embed the query
  const queryEmbedding = await embedText(query, TaskType.RETRIEVAL_QUERY);

  // Score all chunks
  const scored: RagChunk[] = chunks
    .map((chunk) => {
      const embedding = JSON.parse(chunk.embeddingJson) as number[];
      return {
        id: chunk.id,
        content: chunk.content,
        documentTitle: chunk.document.title,
        score: cosineSimilarity(queryEmbedding, embedding),
      };
    })
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}
