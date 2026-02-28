'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { QueryCard } from '@/components/dashboard/query-card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, LogIn, RefreshCw, Users, MessageSquare, Globe, BookOpen } from 'lucide-react';
import type { QueryWithReview } from '@/types';

interface ServiceInfo {
  id: string;
  serviceCode: string;
  name: string;
  description: string | null;
  logoEmoji: string;
  _count: { members: number; queries: number };
}

interface MemberInfo {
  id: string;
  role: string;
  serviceId: string;
}

export default function ServicePage({ params }: { params: { serviceCode: string } }) {
  const { user, isLoading: authLoading } = useUser();
  const [service, setService] = useState<ServiceInfo | null>(null);
  const [membership, setMembership] = useState<MemberInfo | null>(null);
  const [queries, setQueries] = useState<QueryWithReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Query form
  const [queryContent, setQueryContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Load service info + auto-enroll
  useEffect(() => {
    if (authLoading) return;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/service-page/${params.serviceCode}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Service not found');
        setService(data.service);
        setMembership(data.membership ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load service');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.serviceCode, authLoading, user]);

  // Load query history
  const loadQueries = useCallback(async () => {
    if (!service || !membership) return;
    try {
      const res = await fetch(`/api/queries?serviceId=${service.id}&mine=true`);
      const data = await res.json();
      if (res.ok) setQueries(data.queries ?? []);
    } catch {}
  }, [service, membership]);

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  // Auto-refresh to show status updates
  useEffect(() => {
    if (!membership) return;
    const interval = setInterval(loadQueries, 12000);
    return () => clearInterval(interval);
  }, [membership, loadQueries]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!queryContent.trim() || submitting || !service || !membership) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: queryContent.trim(), serviceId: service.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit');
      setQueryContent('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      loadQueries();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-neo-cream flex items-center justify-center">
        <div className="border-3 border-neo-black shadow-brutal bg-white p-8 text-center">
          <div className="w-10 h-10 border-3 border-neo-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-display font-bold">Loading service...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-neo-cream flex items-center justify-center">
        <div className="border-3 border-neo-black shadow-brutal-lg bg-neo-orange p-8 text-center max-w-md">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="font-display font-black text-2xl mb-2">Service Not Found</h1>
          <p className="font-body text-sm text-neo-black/70">{error || 'This service code does not exist.'}</p>
          <a href="/" className="neo-btn-black px-6 py-3 text-sm mt-6 inline-flex">← Back Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Service Header */}
      <header className="bg-neo-black text-white border-b-3 border-neo-black sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neo-yellow border-3 border-white flex items-center justify-center text-xl shrink-0">
              {service.logoEmoji}
            </div>
            <div>
              <h1 className="font-display font-black text-lg leading-tight">{service.name}</h1>
              <span className="font-mono text-xs text-white/50">{service.serviceCode}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {membership && (
              <Badge variant="yellow" className="hidden md:flex">
                {membership.role}
              </Badge>
            )}
            {!user ? (
              <a
                href={`/api/auth/login?returnTo=/s/${params.serviceCode}`}
                className="neo-btn bg-neo-yellow text-neo-black px-3 py-1.5 text-sm gap-1"
              >
                <LogIn size={14} /> Sign In
              </a>
            ) : (
              <a href="/api/auth/logout" className="text-xs font-body text-white/50 hover:text-white transition-colors">
                Sign out
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-4 py-8 flex-1 space-y-8">
        {/* Service info */}
        <div className="border-3 border-neo-black shadow-brutal bg-neo-yellow p-6">
          <div className="flex flex-wrap items-start gap-4 mb-4">
            <div className="text-5xl">{service.logoEmoji}</div>
            <div className="flex-1">
              <h2 className="font-display font-black text-2xl mb-1">{service.name}</h2>
              {service.description && (
                <p className="font-body text-neo-black/70">{service.description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-4 border-t-3 border-neo-black">
            <span className="flex items-center gap-1.5 font-display font-bold text-sm">
              <Users size={14} /> {service._count.members} members
            </span>
            <span className="flex items-center gap-1.5 font-display font-bold text-sm">
              <MessageSquare size={14} /> {service._count.queries} queries answered
            </span>
            <div className="ml-auto flex gap-2">
              {membership?.role === 'USER' && (
                <span className="flex items-center gap-1 text-xs font-body border-2 border-neo-black bg-white px-2 py-1">
                  ✓ Joined as USER
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Query Form */}
        {!user ? (
          <div className="border-3 border-neo-black shadow-brutal bg-neo-blue p-8 text-center">
            <Sparkles size={32} className="mx-auto mb-3 opacity-60" />
            <h3 className="font-display font-black text-xl mb-2">Sign in to ask questions</h3>
            <p className="font-body text-sm text-neo-black/60 mb-6">
              Create a free account to ask questions and get expert-reviewed AI answers.
            </p>
            <a
              href={`/api/auth/login?returnTo=/s/${params.serviceCode}`}
              className="neo-btn-black px-6 py-3 text-base gap-2 inline-flex"
            >
              <LogIn size={18} /> Sign In / Sign Up
            </a>
          </div>
        ) : (
          <div className="border-3 border-neo-black shadow-brutal-lg bg-neo-black text-white">
            <div className="flex items-center gap-3 px-5 py-4 border-b-3 border-white/20">
              <Sparkles size={18} className="text-neo-yellow" />
              <span className="font-display font-black text-base">Ask a Question</span>
              <div className="ml-auto flex items-center gap-3 text-xs text-white/40">
                <span className="flex items-center gap-1"><Globe size={11} /> Web search</span>
                <span className="flex items-center gap-1"><BookOpen size={11} /> Knowledge base</span>
                <span className="flex items-center gap-1">👩‍💼 Human review</span>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <Textarea
                placeholder="Ask anything — your question will be researched with web search and knowledge base, then reviewed by an expert..."
                value={queryContent}
                onChange={(e) => setQueryContent(e.target.value)}
                rows={4}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-neo-yellow focus:shadow-none"
              />
              {submitError && (
                <div className="border-3 border-red-400 bg-red-900/30 p-3">
                  <p className="font-display font-bold text-sm text-red-300">{submitError}</p>
                </div>
              )}
              {submitted && (
                <div className="border-3 border-neo-green bg-neo-green/20 p-3">
                  <p className="font-display font-bold text-sm text-neo-green">
                    ✓ Submitted! AI is researching your query. A reviewer will check it shortly.
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40 font-body">
                  {submitting ? (
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
                      Running agent pipeline...
                    </span>
                  ) : 'Expert-reviewed response. Usually answered in minutes.'}
                </span>
                <Button
                  type="submit"
                  variant="yellow"
                  loading={submitting}
                  disabled={!queryContent.trim()}
                  className="gap-2"
                >
                  Ask <Send size={14} />
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Query History */}
        {user && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-black text-lg flex items-center gap-2">
                <MessageSquare size={18} /> Your Questions
              </h3>
              <Button variant="white" size="sm" onClick={loadQueries} className="gap-1">
                <RefreshCw size={12} />
              </Button>
            </div>

            {queries.length === 0 ? (
              <div className="border-3 border-neo-black bg-neo-cream p-8 text-center">
                <MessageSquare size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-display font-bold text-sm">No questions yet. Ask your first question above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {queries.map((q) => (
                  <QueryCard key={q.id} query={q} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t-3 border-neo-black bg-neo-black text-white/40 py-4 text-center">
        <p className="font-body text-xs">
          Powered by <a href="/" className="text-neo-yellow font-bold hover:underline">ReviewIQ</a> — Human-AI Collaboration
        </p>
      </footer>
    </div>
  );
}
