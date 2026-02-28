'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ReviewCard } from '@/components/dashboard/review-card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Inbox, AlertCircle } from 'lucide-react';
import type { QueryWithReview } from '@/types';

export default function ReviewerPage() {
  const searchParams = useSearchParams();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [activeServiceId, setActiveServiceId] = useState<string>('');
  const [queries, setQueries] = useState<QueryWithReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Load user's services
  useEffect(() => {
    async function loadServices() {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (res.ok && data.memberships?.length > 0) {
        setMemberships(data.memberships);
        const paramId = searchParams.get('serviceId');
        setActiveServiceId(paramId ?? data.memberships[0].service.id);
      }
    }
    loadServices();
  }, [searchParams]);

  const loadReviewQueue = useCallback(async (silent = false) => {
    if (!activeServiceId) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');

    try {
      const res = await fetch(`/api/queries?serviceId=${activeServiceId}&status=PENDING_REVIEW`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQueries(data.queries ?? []);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review queue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeServiceId]);

  useEffect(() => {
    if (activeServiceId) loadReviewQueue();
  }, [activeServiceId, loadReviewQueue]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!activeServiceId) return;
    const interval = setInterval(() => loadReviewQueue(true), 30000);
    return () => clearInterval(interval);
  }, [activeServiceId, loadReviewQueue]);

  const activeService = memberships.find(m => m.service.id === activeServiceId);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-3 border-neo-black shadow-brutal bg-neo-pink p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-black text-2xl mb-1">Review Queue</h1>
            <p className="font-body text-sm text-neo-black/60">
              Review AI-drafted responses. Edit, approve, or reject.
            </p>
          </div>
          <Button
            variant="black"
            size="sm"
            loading={refreshing}
            onClick={() => loadReviewQueue(false)}
            className="gap-1 shrink-0"
          >
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* Service selector */}
      {memberships.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {memberships.map(({ service }: any) => (
            <button
              key={service.id}
              onClick={() => setActiveServiceId(service.id)}
              className={`flex items-center gap-2 px-4 py-2 border-3 border-neo-black font-display font-bold text-sm whitespace-nowrap transition-all ${
                activeServiceId === service.id
                  ? 'bg-neo-black text-white shadow-brutal-sm'
                  : 'bg-white hover:bg-neo-cream'
              }`}
            >
              {service.logoEmoji} {service.name}
            </button>
          ))}
        </div>
      )}

      {/* Stats bar */}
      {!loading && (
        <div className="grid grid-cols-3 border-3 border-neo-black">
          <div className="p-3 text-center border-r-3 border-neo-black bg-neo-yellow">
            <div className="font-display font-black text-2xl">{queries.length}</div>
            <div className="text-xs font-body text-neo-black/60">Pending</div>
          </div>
          <div className="p-3 text-center border-r-3 border-neo-black bg-white">
            <div className="font-display font-black text-2xl">{activeService?.service._count?.members ?? '–'}</div>
            <div className="text-xs font-body text-neo-black/60">Reviewers</div>
          </div>
          <div className="p-3 text-center bg-white">
            <div className="font-display font-black text-sm text-neo-black/60">
              {lastRefreshed ? lastRefreshed.toLocaleTimeString() : '–'}
            </div>
            <div className="text-xs font-body text-neo-black/60">Last refresh</div>
          </div>
        </div>
      )}

      {error && (
        <div className="border-3 border-red-600 bg-red-50 p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <p className="font-display font-bold text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Queue */}
      {loading ? (
        <div className="border-3 border-neo-black p-12 text-center">
          <div className="w-10 h-10 border-3 border-neo-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-display font-bold">Loading review queue...</p>
        </div>
      ) : queries.length === 0 ? (
        <div className="border-3 border-neo-black p-12 text-center bg-neo-green">
          <Inbox size={48} className="mx-auto mb-4 opacity-40" />
          <h3 className="font-display font-black text-xl mb-2">Queue is Empty!</h3>
          <p className="font-body text-sm text-neo-black/60 mb-4">
            No queries waiting for review. Auto-refreshes every 30 seconds.
          </p>
          <Button variant="black" onClick={() => loadReviewQueue()} size="sm">
            <RefreshCw size={14} /> Check Now
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="font-display font-bold text-sm text-neo-black/50">
            {queries.length} quer{queries.length === 1 ? 'y' : 'ies'} awaiting your review
          </p>
          {queries.map((query) => (
            <ReviewCard
              key={query.id}
              query={query}
              onReviewed={() => loadReviewQueue(true)}
            />
          ))}
        </div>
      )}

      {memberships.length === 0 && !loading && (
        <div className="border-3 border-neo-black p-8 text-center bg-neo-cream">
          <p className="font-display font-bold text-lg mb-2">No Services</p>
          <p className="font-body text-sm text-neo-black/50 mb-4">
            Create or join a service first to access the review queue.
          </p>
          <a href="/dashboard/admin" className="neo-btn-yellow px-4 py-2 text-sm inline-flex">
            Get Started →
          </a>
        </div>
      )}
    </div>
  );
}
