import { GoogleGenerativeAI } from '@google/generative-ai';
import { routeQuery, webSearch } from './search';
import { findRelevantChunks } from './rag';
import { env } from './env';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

const DRAFT_MODEL = env.DRAFT_GEMINI_MODEL;
const FINAL_MODEL = env.FINAL_GEMINI_MODEL;

export interface Source {
  type: 'web' | 'rag';
  title: string;
  url?: string;
  excerpt: string;
}

export interface AgentLog {
  usedSearch: boolean;
  usedRAG: boolean;
  searchQuery?: string;
  ragCount: number;
  routingReason: string;
}

export interface AgentResult {
  draft: string;
  sources: Source[];
  agentLog: AgentLog;
}


async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 8000): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const is429 = err?.status === 429 || String(err?.message).includes('429');
    if (is429 && retries > 0) {
      await new Promise((res) => setTimeout(res, delayMs));
      return withRetry(fn, retries - 1, delayMs * 2);
    }
    throw err;
  }
}


export async function generateInitialDraftWithAgent(
  query: string,
  serviceName: string,
  serviceId: string,
  systemPrompt?: string | null
): Promise<AgentResult> {
  const agentLog: AgentLog = {
    usedSearch: false,
    usedRAG: false,
    ragCount: 0,
    routingReason: '',
  };
  const sources: Source[] = [];

  // Step 1: Route
  let routing = { needsSearch: false, reason: '', searchQuery: '' };
  try {
    routing = await routeQuery(query);
    agentLog.routingReason = routing.reason; // Showcase the reason to end-user + confidence
  } catch (e) {
    console.error('[Agent] Routing failed:', e);
  }

  // Step 2: Web Search (if needed) 
  if (routing.needsSearch) {
    try {
      const searchQuery = routing.searchQuery || query;
      agentLog.searchQuery = searchQuery;
      const results = await webSearch(searchQuery);
      console.log("SELECTED_WEB_PATH: ", results);
      if (results.length > 0) {
        agentLog.usedSearch = true;
        for (const r of results) {
          sources.push({
            type: 'web',
            title: r.title,
            url: r.url,
            excerpt: r.content.slice(0, 400),
          });
        }
      }
    } catch (e) {
      console.error('[Agent] Web search failed:', e);
    }
  }

  //  Step 3: RAG Retrieval 
  try {
    const chunks = await findRelevantChunks(query, serviceId);
    if (chunks.length > 0) {
      agentLog.usedRAG = true;
      agentLog.ragCount = chunks.length;
      for (const chunk of chunks) {
        sources.push({
          type: 'rag',
          title: chunk.documentTitle,
          excerpt: chunk.content.slice(0, 400),
        });
      }
    }
  } catch (e) {
    console.error('[Agent] RAG retrieval failed:', e);
  }

  // Step 4: Generate Draft with context
  const draft = await generateDraftWithContext(query, serviceName, sources, systemPrompt);

  return { draft, sources, agentLog };
}

async function generateDraftWithContext(
  query: string,
  serviceName: string,
  sources: Source[],
  systemPrompt?: string | null
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: DRAFT_MODEL });

  const webSources = sources.filter((s) => s.type === 'web');
  const ragSources = sources.filter((s) => s.type === 'rag');

  let contextSection = '';
  if (webSources.length > 0) {
    contextSection += `\n\n## Live Web Search Results:\n`;
    webSources.forEach((s, i) => {
      contextSection += `[${i + 1}] ${s.title}${s.url ? ` (${s.url})` : ''}\n${s.excerpt}\n\n`;
    });
  }
  if (ragSources.length > 0) {
    contextSection += `\n\n## Relevant Knowledge Base Excerpts:\n`;
    ragSources.forEach((s, i) => {
      contextSection += `[KB-${i + 1}] From "${s.title}":\n${s.excerpt}\n\n`;
    });
  }

  const hasContext = sources.length > 0;
  const systemInstruction = systemPrompt?.trim()
    ? `${systemPrompt.trim()}\n\n`
    : `You are a helpful AI assistant for "${serviceName}".\n\n`;

  const prompt = `${systemInstruction}A user has submitted the following query that will be reviewed by a human expert.

User Query: ${query}
${hasContext ? contextSection : ''}
${hasContext ? 'Using the context above where relevant,' : ''} Provide a clear, accurate, and concise draft response (2-3 paragraphs). This is a DRAFT for human review. Reference sources when used.`;

  const result = await withRetry(() => model.generateContent(prompt));
  return result.response.text();
}

// ─── Final Answer ─────────────────────────────────────────────────────────────

export async function generateDetailedAnswer(
  originalQuery: string,
  reviewedContent: string,
  reviewerNote: string | null,
  serviceName: string,
  sources: Source[] = [],
  systemPrompt?: string | null
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: FINAL_MODEL });

  const noteContext = reviewerNote
    ? `A human expert reviewed the draft and provided this guidance: "${reviewerNote}". They approved this refined response:`
    : `A human expert reviewed and approved this response:`;

  const sourcesSection =
    sources.length > 0
      ? `\n\nSources used:\n${sources.map((s) => `- ${s.type === 'web' ? '🌐' : '📚'} ${s.title}${s.url ? ` — ${s.url}` : ''}`).join('\n')}`
      : '';

  const systemInstruction = systemPrompt?.trim()
    ? `${systemPrompt.trim()}\n\n`
    : `You are a helpful AI assistant for "${serviceName}".\n\n`;

  const prompt = `${systemInstruction}A human expert has reviewed and approved an AI draft.

Original User Query:
${originalQuery}

${noteContext}
${reviewedContent}
${sourcesSection}

Generate a comprehensive, detailed, and well-structured final answer. Include:
- A clear, direct answer to the query
- Relevant context and background
- Step-by-step details where applicable
- Practical examples or use cases
- Important caveats or considerations
- A helpful summary

Format with markdown (## headers, bullet points, code blocks). Be thorough but not verbose.`;

  const result = await withRetry(() => model.generateContent(prompt));
  return result.response.text();
}
