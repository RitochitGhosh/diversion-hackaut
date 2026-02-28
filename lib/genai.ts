import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// gemini-2.5-flash works on free tier; gemini-2.5-pro has no free-tier quota
const DRAFT_MODEL = 'gemini-2.5-flash';
const FINAL_MODEL = 'gemini-2.5-flash';

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 8000): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const is429 = err?.status === 429 || err?.message?.includes('429');
    if (is429 && retries > 0) {
      await new Promise((res) => setTimeout(res, delayMs));
      return withRetry(fn, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

export async function generateInitialDraft(query: string, serviceName: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: DRAFT_MODEL });

  const prompt = `You are a helpful AI assistant for "${serviceName}". A user has submitted the following query that will be reviewed by a human expert before being finalized.

User Query: ${query}

Provide a clear, accurate, and concise initial response (2-3 paragraphs). This is a DRAFT that a human reviewer will edit or approve. Be helpful and informative, but keep it focused.`;

  const result = await withRetry(() => model.generateContent(prompt));
  return result.response.text();
}

export async function generateDetailedAnswer(
  originalQuery: string,
  reviewedContent: string,
  reviewerNote: string | null,
  serviceName: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: FINAL_MODEL });

  const noteContext = reviewerNote
    ? `A human expert reviewed the draft and provided this guidance: "${reviewerNote}". They approved this refined response:`
    : `A human expert reviewed and approved this response:`;

  const prompt = `You are a helpful AI assistant for "${serviceName}". A human expert has reviewed an initial AI draft and either approved or refined it.

Original User Query:
${originalQuery}

${noteContext}
${reviewedContent}

Now generate a comprehensive, detailed, and well-structured final answer. The human expert's review has validated the direction. Expand on it with:
- A clear, direct answer to the query
- Relevant context and background
- Step-by-step details where applicable
- Practical examples or use cases
- Important caveats or considerations
- A helpful summary

Format your response using clear markdown with headers (##), bullet points, and code blocks where appropriate. Be thorough but not verbose.`;

  const result = await withRetry(() => model.generateContent(prompt));
  return result.response.text();
}
