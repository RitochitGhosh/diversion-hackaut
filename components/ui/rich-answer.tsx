'use client';

import { useMemo } from 'react';

// ─── YouTube helpers ──────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

// ─── Segment types ────────────────────────────────────────────────────────────

type TextSegment = { kind: 'text'; content: string };
type YouTubeSegment = { kind: 'youtube'; videoId: string };
type Segment = TextSegment | YouTubeSegment;

const YT_REGEX =
  /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?[^\s]*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})[^\s]*/g;

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  YT_REGEX.lastIndex = 0;

  while ((match = YT_REGEX.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ kind: 'text', content: text.slice(last, match.index) });
    }
    const id = extractYouTubeId(match[0]);
    if (id) segments.push({ kind: 'youtube', videoId: id });
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    segments.push({ kind: 'text', content: text.slice(last) });
  }
  return segments;
}

// ─── Markdown-to-HTML (safe subset) ──────────────────────────────────────────

function renderMarkdown(text: string): string {
  return (
    text
      // Headings
      .replace(/^#### (.+)$/gm, '<h4 class="font-display font-black text-base mt-4 mb-1">$1</h4>')
      .replace(/^### (.+)$/gm, '<h3 class="font-display font-black text-lg mt-5 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="font-display font-black text-xl mt-6 mb-3">$1</h2>')
      // Bold / italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-neo-cream px-1 py-0.5 font-mono text-xs border border-neo-black/30 rounded">$1</code>'
      )
      // Images — render as real <img>
      .replace(
        /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g,
        '<img src="$2" alt="$1" class="max-w-full border-3 border-neo-black my-3 block" loading="lazy" />'
      )
      // Links
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="font-bold underline hover:bg-neo-yellow transition-colors">$1</a>'
      )
      // Unordered list items
      .replace(/^[*-] (.+)$/gm, '<li class="ml-5 list-disc leading-relaxed">$1</li>')
      // Ordered list items
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-5 list-decimal leading-relaxed">$1</li>')
      // Horizontal rule
      .replace(/^---+$/gm, '<hr class="border-t-3 border-neo-black my-4" />')
      // Double newline → paragraph break
      .replace(/\n\n/g, '</p><p class="mb-3">')
      // Single newline → line break
      .replace(/\n/g, '<br />')
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RichAnswerProps {
  content: string;
  className?: string;
}

export function RichAnswer({ content, className = '' }: RichAnswerProps) {
  const segments = useMemo(() => parseSegments(content), [content]);

  return (
    <div className={`space-y-4 ${className}`}>
      {segments.map((seg, i) => {
        if (seg.kind === 'youtube') {
          return (
            <div key={i} className="border-3 border-neo-black overflow-hidden shadow-brutal-sm">
              <div className="bg-neo-black px-3 py-1.5 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 border border-white/20" />
                <span className="font-display font-bold text-xs text-white">YouTube</span>
              </div>
              <iframe
                src={`https://www.youtube.com/embed/${seg.videoId}`}
                className="w-full aspect-video"
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
              />
            </div>
          );
        }

        const html = renderMarkdown(seg.content);
        return (
          <div
            key={i}
            className="text-sm leading-relaxed font-body text-neo-black"
            // Content sourced from our own AI — not raw user input
            dangerouslySetInnerHTML={{ __html: `<p class="mb-3">${html}</p>` }}
          />
        );
      })}
    </div>
  );
}
