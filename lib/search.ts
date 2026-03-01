import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export interface RouterResult {
  needsSearch: boolean;
  reason: string;
  searchQuery: string;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

// Step 1: Route — decide if the query needs live web search
export async function routeQuery(query: string): Promise<RouterResult> {
  const model = genAI.getGenerativeModel({
    model: env.DRAFT_GEMINI_MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `You are a query router for an AI assistant. Decide whether the following query requires a live web search for current/real-time information.

Query: "${query}"

Queries that NEED web search:
- Current events, news, recent developments
- Real-time data (prices, weather, stocks)
- Queries mentioning "latest", "current", "today", "2024", "2025", "recent"
- Specific product versions, software releases, updates

Queries that DO NOT need web search:
- General concepts, definitions, explanations
- How-to guides for well-established topics
- Historical information
- Programming patterns, algorithms, best practices

Return ONLY a JSON object (no markdown) with this exact structure:
{"needsSearch": boolean, "reason": "brief explanation", "searchQuery": "optimized search query if needed, else empty string"}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const parsed = JSON.parse(text);
    console.log("PATH_DECIDE_RESULT: ", parsed);
    return {
      needsSearch: Boolean(parsed.needsSearch),
      reason: parsed.reason ?? '',
      searchQuery: parsed.searchQuery ?? '',
    };
  } catch {
    return { needsSearch: false, reason: 'Routing failed — using direct generation', searchQuery: '' };
  }
}

// Step 2: Web search — Tavily first, DuckDuckGo fallback //  TODO: Test Tavily end to end, to give topK best results
export async function webSearch(query: string): Promise<SearchResult[]> {
  if (env.TAVILY_API_KEY) {
    try {
      return await tavilySearch(query);
    } catch (e) {
      console.error('[Tavily search failed, falling back to DDG]', e);
    }
  }
  return duckDuckGoSearch(query);
}

async function tavilySearch(query: string): Promise<SearchResult[]> {
  if (!env.TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY is not configured');
  }
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      search_depth: 'basic',
      max_results: 5,
      include_answer: false,
      include_images: false,
      country: 'india'
    }),
  });
  if (!res.ok) throw new Error(`Tavily ${res.status}`);
  const data = await res.json();
  console.log("TAVILTY_RESPONSE: ", data);
  return (data.results ?? []).map((r: any) => ({
    title: r.title ?? '',
    url: r.url ?? '',
    content: r.content ?? r.snippet ?? '',
  }));
}

async function duckDuckGoSearch(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'ReviewIQ-Agent/1.0' } });
    const data = await res.json();
    const results: SearchResult[] = [];

    if (data.AbstractText) {
      results.push({
        title: data.Heading || data.AbstractSource || 'Summary',
        url: data.AbstractURL || '',
        content: data.AbstractText,
      });
    }

    for (const topic of (data.RelatedTopics ?? []).slice(0, 5)) {
      if (topic.Text && topic.FirstURL) {
        results.push({
          title: topic.Text.slice(0, 80),
          url: topic.FirstURL,
          content: topic.Text,
        });
      }
    }

    return results.slice(0, 5);
  } catch (e) {
    console.error('[DuckDuckGo search failed]', e);
    return [];
  }
}
