'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Send } from 'lucide-react';

interface QueryFormProps {
  serviceId: string;
  onQuerySubmitted: () => void;
}

export function QueryForm({ serviceId, onQuerySubmitted }: QueryFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), serviceId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit query');

      setContent('');
      setSuccess(true);
      onQuerySubmitted();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-3 border-neo-black shadow-brutal-lg bg-neo-yellow">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b-3 border-neo-black bg-neo-black text-white">
        <Sparkles size={18} className="text-neo-yellow" />
        <span className="font-display font-black text-base">Ask the AI</span>
        <span className="ml-auto text-xs font-body text-white/50">Reviewed by human experts</span>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <Textarea
          id="query"
          placeholder="Ask anything... e.g., 'How do I implement JWT refresh tokens in Node.js?' or 'What are best practices for PostgreSQL indexing?'"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="bg-white border-3 border-neo-black focus:shadow-brutal"
        />

        {error && (
          <div className="border-3 border-red-600 bg-red-50 p-3">
            <p className="font-display font-bold text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="border-3 border-neo-black bg-neo-green p-3 shadow-brutal-sm">
            <p className="font-display font-bold text-sm">
              ✓ Query submitted! AI is drafting a response. A reviewer will check it shortly.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs font-body text-neo-black/60">
            {submitting ? (
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 border-2 border-neo-black border-t-transparent rounded-full animate-spin" />
                Generating AI draft...
              </span>
            ) : (
              <span>{content.length > 0 ? `${content.length} chars` : 'Be specific for better answers'}</span>
            )}
          </div>
          <Button
            type="submit"
            variant="black"
            loading={submitting}
            disabled={!content.trim()}
            className="gap-2"
          >
            Submit Query <Send size={14} />
          </Button>
        </div>
      </form>
    </div>
  );
}
