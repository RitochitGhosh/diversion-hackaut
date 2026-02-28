'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatDate, STATUS_LABELS } from '@/lib/utils';
import { ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, Edit3, Loader } from 'lucide-react';
import type { QueryWithReview, QueryStatus } from '@/types';

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

export function QueryCard({ query }: QueryCardProps) {
  const [expanded, setExpanded] = useState(false);

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
            <span className="text-xs text-neo-black/40 font-body">{formatDate(query.createdAt)}</span>
          </div>
        </div>
        <div className="shrink-0 mt-1 text-neo-black/40">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t-3 border-neo-black">
          {/* Query */}
          <div className="p-4 bg-neo-cream border-b-3 border-neo-black">
            <p className="font-display font-bold text-xs uppercase tracking-wide text-neo-black/40 mb-2">Your Query</p>
            <p className="font-body text-sm leading-relaxed">{query.content}</p>
          </div>

          {/* Status steps */}
          {(query.status === 'PENDING_AI' || query.status === 'PENDING_REVIEW') && (
            <div className="p-4 border-b-3 border-neo-black bg-neo-yellow/30">
              <div className="flex items-center gap-2">
                {query.status === 'PENDING_AI' ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <p className="font-display font-bold text-sm">AI is generating a draft response...</p>
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

          {/* AI Draft (show only to reviewer/admin) */}
          {query.aiDraft && query.status === 'PENDING_REVIEW' && (
            <div className="p-4 border-b-3 border-neo-black">
              <p className="font-display font-bold text-xs uppercase tracking-wide text-neo-black/40 mb-2">⚡ AI Draft (Under Review)</p>
              <p className="font-body text-sm text-neo-black/70 line-clamp-3 italic">{query.aiDraft}</p>
            </div>
          )}

          {/* Review info */}
          {query.review && (
            <div className="p-4 border-b-3 border-neo-black bg-neo-blue/10">
              <p className="font-display font-bold text-xs uppercase tracking-wide text-neo-black/40 mb-2">
                Review by {query.review.reviewer.name ?? query.review.reviewer.email}
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
              <div className="border-3 border-neo-black bg-white p-4 prose-neo">
                <div
                  className="prose-neo text-sm"
                  dangerouslySetInnerHTML={{
                    __html: query.finalAnswer
                      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/`(.+?)`/g, '<code>$1</code>')
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
                  This query was rejected by the reviewer.
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
