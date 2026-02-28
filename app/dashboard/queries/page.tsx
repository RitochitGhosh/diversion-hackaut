'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { QueryForm } from '@/components/dashboard/query-form';
import { QueryCard } from '@/components/dashboard/query-card';
import { Button } from '@/components/ui/button';
import { RefreshCw, MessageSquare, Filter } from 'lucide-react';
import type { QueryWithReview, QueryStatus } from '@/types';

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'ANSWERED', label: 'Answered' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function QueriesPage() {
  const searchParams = useSearchParams();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [activeServiceId, setActiveServiceId] = useState<string>('');
  const [queries, setQueries] = useState<QueryWithReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [mineOnly, setMineOnly] = useState(true);
  const [error, setError] = useState('');

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

  const loadQueries = useCallback(async () => {
    if (!activeServiceId) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ serviceId: activeServiceId });
      if (statusFilter) params.set('status', statusFilter);
      if (mineOnly) params.set('mine', 'true');
      const res = await fetch(`/api/queries?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQueries(data.queries ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queries');
    } finally {
      setLoading(false);
    }
  }, [activeServiceId, statusFilter, mineOnly]);

  useEffect(() => {
    if (activeServiceId) loadQueries();
  }, [activeServiceId, statusFilter, mineOnly, loadQueries]);

  // Auto-refresh every 15s to catch status updates
  useEffect(() => {
    if (!activeServiceId) return;
    const interval = setInterval(loadQueries, 15000);
    return () => clearInterval(interval);
  }, [activeServiceId, loadQueries]);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-3 border-neo-black shadow-brutal bg-neo-blue p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-black text-2xl mb-1 flex items-center gap-2">
              <MessageSquare size={22} /> Queries
            </h1>
            <p className="font-body text-sm text-neo-black/60">
              Ask questions. Track AI drafts and reviewed answers.
            </p>
          </div>
          <Button variant="black" size="sm" onClick={loadQueries} className="gap-1 shrink-0">
            <RefreshCw size={14} />
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
                  ? 'bg-neo-black text-white'
                  : 'bg-white hover:bg-neo-cream'
              }`}
            >
              {service.logoEmoji} {service.name}
            </button>
          ))}
        </div>
      )}

      {/* Query submission */}
      {activeServiceId && (
        <QueryForm serviceId={activeServiceId} onQuerySubmitted={loadQueries} />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1 font-display font-bold text-sm text-neo-black/50">
          <Filter size={14} /> Filter:
        </div>
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`px-3 py-1.5 border-3 border-neo-black font-display font-bold text-xs transition-all ${
              statusFilter === value ? 'bg-neo-black text-white' : 'bg-white hover:bg-neo-cream'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setMineOnly(!mineOnly)}
          className={`px-3 py-1.5 border-3 border-neo-black font-display font-bold text-xs transition-all ml-auto ${
            mineOnly ? 'bg-neo-yellow' : 'bg-white hover:bg-neo-cream'
          }`}
        >
          {mineOnly ? '👤 My Queries' : '🌐 All Queries'}
        </button>
      </div>

      {error && (
        <div className="border-3 border-red-600 bg-red-50 p-4">
          <p className="font-display font-bold text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Query list */}
      {loading ? (
        <div className="border-3 border-neo-black p-12 text-center">
          <div className="w-10 h-10 border-3 border-neo-black border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : queries.length === 0 ? (
        <div className="border-3 border-neo-black p-10 text-center bg-neo-cream">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          <h3 className="font-display font-black text-lg mb-1">No queries yet</h3>
          <p className="font-body text-sm text-neo-black/50">Submit your first query above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="font-display font-bold text-sm text-neo-black/50">
            {queries.length} quer{queries.length === 1 ? 'y' : 'ies'}
          </p>
          {queries.map((query) => (
            <QueryCard key={query.id} query={query} />
          ))}
        </div>
      )}

      {memberships.length === 0 && !loading && (
        <div className="border-3 border-neo-black p-8 text-center bg-neo-cream">
          <p className="font-display font-bold text-lg mb-2">Join a Service First</p>
          <a href="/dashboard/admin" className="neo-btn-yellow px-4 py-2 text-sm inline-flex">
            Get Started →
          </a>
        </div>
      )}
    </div>
  );
}
