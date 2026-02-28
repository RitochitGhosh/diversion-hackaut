'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatDate, STATUS_LABELS } from '@/lib/utils';
import {
  ChevronDown, ChevronUp, Clock, CheckCircle, XCircle,
  Edit3, Loader, Globe, BookOpen, Search, Zap,
} from 'lucide-react';
import type { QueryWithReview, QueryStatus, Source, AgentLog } from '@/types';

const statusIcons: Record<QueryStatus, React.ReactNode> = {
  PENDING_AI: <Loader size={14} className="animate-spin" />,
  PENDING_REVIEW: <Clock size={14} />,
  APPROVED: <CheckCircle size={14} />,
  EDITED: <Edit3 size={14} />,
  REJECTED: <XCircle size={14} />,
  ANSWERED: <CheckCircle size={14} />,
};

const statusVariants: Record<QueryStatus, 'yellow' | 'blue' | 'green' | 'pink' | 'orange' | 'purple'> = {
  PENDING_AI: 'purple',
  PENDING_REVIEW: 'yellow',
  APPROVED: 'green',
  EDITED: 'blue',
  REJECTED: 'orange',
  ANSWERED: 'green',
};

interface QueryCardProps {
  query: QueryWithReview;
}

function AgentBadges({ agentLog }: { agentLog: AgentLog }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {agentLog.usedSearch && (
        <span className="flex items-center gap-1 text-xs font-display font-bold border-2 border-neo-black bg-neo-blue px-2 py-0.5">
          <Globe size={10} /> Web Search
        </span>
      )}
      {agentLog.usedRAG && (
        <span className="flex items-center gap-1 text-xs font-display font-bold border-2 border-neo-black bg-neo-purple px-2 py-0.5">
          <BookOpen size={10} /> {agentLog.ragCount} KB chunks
        </span>
      )}
      {!agentLog.usedSearch && !agentLog.usedRAG && (
        <span className="flex items-center gap-1 text-xs font-display font-bold border-2 border-neo-black bg-neo-cream px-2 py-0.5">
          <Zap size={10} /> Direct AI
        </span>
      )}
    </div>
  );
}

function SourcesList({ sources }: { sources: Source[] }) {
  const webSources = sources.filter((s) => s.type === 'web');
  const ragSources = sources.filter((s) => s.type === 'rag');

  return (
    <div className="space-y-3">
      {webSources.length > 0 && (
        <div>
          <p className="font-display font-bold text-xs uppercase tracking-wide text-neo-black/50 mb-2 flex items-center gap-1">
            <Globe size={11} /> Web Sources
          </p>
          <div className="space-y-2">
            {webSources.map((s, i) => (
              <div key={i} className="border-2 border-neo-black bg-neo-blue/20 p-2">
                <div className="flex items-start gap-2">
                  <span className="font-display font-bold text-xs shrink-0">{i + 1}.</span>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-xs leading-tight">
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {s.title}
                        </a>
                      ) : s.title}
                    </p>
                    <p className="text-xs font-body text-neo-black/60 mt-0.5 line-clamp-2">{s.excerpt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ragSources.length > 0 && (
        <div>
          <p className="font-display font-bold text-xs uppercase tracking-wide text-neo-black/50 mb-2 flex items-center gap-1">
            <BookOpen size={11} /> Knowledge Base
          </p>
          <div className="space-y-2">
            {ragSources.map((s, i) => (
              <div key={i} className="border-2 border-neo-black bg-neo-purple/20 p-2">
                <p className="font-display font-bold text-xs mb-0.5">📄 {s.title}</p>
                <p className="text-xs font-body text-neo-black/60 line-clamp-2">{s.excerpt}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function QueryCard({ query }: QueryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const agentLog = query.agentLog as AgentLog | null;
  const sources = (query.sources as Source[] | null) ?? [];

  return (
    <div className="border-3 border-neo-black shadow-brutal bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-4 p-4 hover:bg-neo-cream transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-medium leading-snug line-clamp-2 mb-2">
            {query.content}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={statusVariants[query.status]} className="gap-1">
              {statusIcons[query.status]}
              {STATUS_LABELS[query.status]}
            </Badge>
            {agentLog && <AgentBadges agentLog={agentLog} />}
            <span className="text-xs text-neo-black/40 font-body">{formatDate(query.createdAt)}</span>
          </div>
        </div>
        <div className="shrink-0 mt-1 text-neo-black/40">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t-3 border-neo-black">
          {/* Full query */}
          <div className="p-4 bg-neo-cream border-b-3 border-neo-black">
            <p className="font-display font-bold text-xs uppercase tracking-wide text-neo-black/40 mb-2">Query</p>
            <p className="font-body text-sm leading-relaxed">{query.content}</p>
          </div>

          {/* Agent pipeline info */}
          {agentLog && (
            <div className="p-4 border-b-3 border-neo-black bg-white">
              <p className="font-display font-bold text-xs uppercase tracking-wide text-neo-black/40 mb-2 flex items-center gap-1">
                <Search size={11} /> Agent Pipeline
              </p>
              <AgentBadges agentLog={agentLog} />
              {agentLog.routingReason && (
                <p className="text-xs font-body text-neo-black/50 mt-2 italic">"{agentLog.routingReason}"</p>
              )}
            </div>
          )}

          {/* Status indicator */}
          {(query.status === 'PENDING_AI' || query.status === 'PENDING_REVIEW') && (
            <div className="p-4 border-b-3 border-neo-black bg-neo-yellow/30">
              <div className="flex items-center gap-2">
                {query.status === 'PENDING_AI' ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <p className="font-display font-bold text-sm">AI agent is processing your query...</p>
                  </>
                ) : (
                  <>
                    <Clock size={16} />
                    <p className="font-display font-bold text-sm">Waiting for expert review...</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Sources */}
          {sources.length > 0 && (
            <div className="p-4 border-b-3 border-neo-black">
              <SourcesList sources={sources} />
            </div>
          )}

          {/* Review info */}
          {query.review && (
            <div className="p-4 border-b-3 border-neo-black bg-neo-blue/10">
              <p className="font-display font-bold text-xs uppercase tracking-wide text-neo-black/40 mb-2">
                Reviewed by {query.review.reviewer.name ?? query.review.reviewer.email}
              </p>
              <Badge variant={query.review.action === 'REJECTED' ? 'orange' : query.review.action === 'EDITED' ? 'blue' : 'green'}>
                {query.review.action}
              </Badge>
              {query.review.note && (
                <p className="mt-2 text-xs font-body text-neo-black/60 italic">"{query.review.note}"</p>
              )}
            </div>
          )}

          {/* Final Answer */}
          {query.finalAnswer && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={16} className="text-green-600" />
                <p className="font-display font-black text-sm">Final Answer</p>
              </div>
              <div className="border-3 border-neo-black bg-white p-4">
                <div
                  className="prose-neo text-sm"
                  dangerouslySetInnerHTML={{
                    __html: query.finalAnswer
                      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/`([^`]+)`/g, '<code>$1</code>')
                      .replace(/^- (.+)$/gm, '<li>$1</li>')
                      .replace(/\n\n/g, '<br/><br/>')
                  }}
                />
              </div>
            </div>
          )}

          {/* Rejected */}
          {query.status === 'REJECTED' && (
            <div className="p-4 bg-neo-orange/20 border-t-3 border-neo-black">
              <div className="flex items-center gap-2">
                <XCircle size={16} />
                <p className="font-display font-bold text-sm">
                  Rejected by reviewer.
                  {query.review?.note && ` Reason: "${query.review.note}"`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
