'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, truncate } from '@/lib/utils';
import { ChevronDown, ChevronUp, Check, X, Edit3, Clock, User } from 'lucide-react';
import type { QueryWithReview } from '@/types';

interface ReviewCardProps {
  query: QueryWithReview;
  onReviewed: () => void;
}

export function ReviewCard({ query, onReviewed }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [editedContent, setEditedContent] = useState(query.aiDraft ?? '');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submitReview(action: 'APPROVED' | 'EDITED' | 'REJECTED') {
    if (submitting) return;
    if (action === 'EDITED' && !editedContent.trim()) {
      setError('Edited content cannot be empty');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/queries/${query.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          editedContent: action === 'EDITED' ? editedContent : undefined,
          note: note || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Review failed');
      onReviewed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  return (
    <div className="border-3 border-neo-black shadow-brutal bg-white">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-4 p-4 hover:bg-neo-cream transition-colors text-left"
      >
        <div className="w-10 h-10 shrink-0 bg-neo-yellow border-3 border-neo-black flex items-center justify-center font-display font-black text-lg">
          ?
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-medium leading-snug line-clamp-2">
            {query.content}
          </p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-neo-black/50 font-body">
              <User size={11} />
              {query.submitter.name ?? query.submitter.email}
            </span>
            <span className="flex items-center gap-1 text-xs text-neo-black/50 font-body">
              <Clock size={11} />
              {formatDate(query.createdAt)}
            </span>
            <span className="bg-neo-yellow border-2 border-neo-black px-2 py-0.5 font-display font-bold text-xs">
              Pending Review
            </span>
          </div>
        </div>
        <div className="shrink-0 text-neo-black/40">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t-3 border-neo-black">
          {/* Full query */}
          <div className="p-4 bg-neo-cream border-b-3 border-neo-black">
            <p className="font-display font-bold text-xs uppercase tracking-wider text-neo-black/50 mb-2">
              Full Query
            </p>
            <p className="font-body text-sm leading-relaxed">{query.content}</p>
          </div>

          {/* AI Draft */}
          <div className="p-4 border-b-3 border-neo-black">
            <div className="flex items-center justify-between mb-3">
              <p className="font-display font-bold text-xs uppercase tracking-wider">
                ⚡ AI Draft Response
              </p>
              {mode === 'view' && (
                <Button
                  variant="yellow"
                  size="sm"
                  onClick={() => setMode('edit')}
                  className="gap-1"
                >
                  <Edit3 size={12} /> Edit
                </Button>
              )}
            </div>

            {mode === 'view' ? (
              <div className="bg-neo-blue/20 border-2 border-neo-black p-4">
                <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">
                  {query.aiDraft ?? 'No AI draft available.'}
                </p>
              </div>
            ) : (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={8}
                className="font-body text-sm"
                placeholder="Edit the AI draft here..."
              />
            )}
          </div>

          {/* Reviewer note */}
          <div className="p-4 border-b-3 border-neo-black">
            <Textarea
              label="Reviewer Note (optional)"
              placeholder="Add context or instructions for the final AI answer..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          {error && (
            <div className="mx-4 mb-4 border-3 border-red-600 bg-red-50 p-3">
              <p className="font-display font-bold text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="p-4 bg-neo-cream flex flex-wrap gap-3">
            <Button
              variant="green"
              loading={submitting}
              onClick={() => submitReview('APPROVED')}
              className="gap-2 flex-1 md:flex-none"
            >
              <Check size={16} /> Approve
            </Button>
            {mode === 'edit' && (
              <Button
                variant="blue"
                loading={submitting}
                onClick={() => submitReview('EDITED')}
                className="gap-2 flex-1 md:flex-none"
              >
                <Edit3 size={16} /> Submit Edit
              </Button>
            )}
            <Button
              variant="red"
              loading={submitting}
              onClick={() => submitReview('REJECTED')}
              className="gap-2 flex-1 md:flex-none"
            >
              <X size={16} /> Reject
            </Button>
            {mode === 'edit' && (
              <Button
                variant="white"
                onClick={() => { setMode('view'); setEditedContent(query.aiDraft ?? ''); }}
                className="gap-1"
              >
                Cancel
              </Button>
            )}
          </div>

          {submitting && (
            <div className="px-4 pb-4">
              <div className="border-3 border-neo-black bg-neo-purple p-3 text-center">
                <p className="font-display font-bold text-sm animate-pulse">
                  Generating final answer with AI... Please wait.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
