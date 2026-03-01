'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Zap, CheckCircle, Star, RefreshCw, Shield,
} from 'lucide-react';
import { PLAN_LIMITS } from '@/lib/subscription';
import type { SubscriptionTier } from '@/lib/subscription';

interface SubscriptionData {
  id: string;
  tier: SubscriptionTier;
  expiresAt: string | null;
  createdAt: string;
}

const TIER_ICONS: Record<SubscriptionTier, React.ReactNode> = {
  FREE: <Zap size={18} />,
  PRO: <Star size={18} />,
};

const TIER_COLORS: Record<SubscriptionTier, string> = {
  FREE: 'bg-neo-cream',
  PRO: 'bg-neo-blue',
};

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [activeServiceId, setActiveServiceId] = useState('');
  const [data, setData] = useState<{
    subscription: SubscriptionData;
    queriesThisMonth: number;
    knowledgeDocCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      const res = await fetch('/api/services');
      const json = await res.json();
      if (res.ok && json.memberships?.length > 0) {
        const adminOnly = json.memberships.filter((m: any) => m.role === 'ADMIN');
        setMemberships(adminOnly);
        const paramId = searchParams.get('serviceId');
        setActiveServiceId(paramId ?? (adminOnly[0]?.service.id ?? ''));
      }
    }
    loadServices();
  }, [searchParams]);

  const loadSubscription = useCallback(async () => {
    if (!activeServiceId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/subscription?serviceId=${activeServiceId}`);
      const json = await res.json();
      if (res.ok) setData(json);
    } finally {
      setLoading(false);
    }
  }, [activeServiceId]);

  useEffect(() => {
    if (activeServiceId) loadSubscription();
  }, [activeServiceId, loadSubscription]);

  const tier = data?.subscription.tier ?? 'FREE';
  const limits = PLAN_LIMITS[tier];
  const queryPercent =
    limits.queriesPerMonth !== null && data
      ? Math.min(100, Math.round((data.queriesThisMonth / limits.queriesPerMonth) * 100))
      : 0;
  const docPercent =
    limits.maxKnowledgeDocs !== null && data
      ? Math.min(100, Math.round((data.knowledgeDocCount / limits.maxKnowledgeDocs) * 100))
      : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-3 border-neo-black shadow-brutal bg-neo-yellow p-5">
        <h1 className="font-display font-black text-2xl mb-1 flex items-center gap-2">
          <Shield size={22} /> Subscription
        </h1>
        <p className="font-body text-sm text-neo-black/70">
          Manage your plan and usage.
        </p>
      </div>

      {/* Service selector */}
      {memberships.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {memberships.map(({ service }: any) => (
            <button
              key={service.id}
              onClick={() => setActiveServiceId(service.id)}
              className={`flex items-center gap-2 px-4 py-2 border-3 border-neo-black font-display font-bold text-sm whitespace-nowrap transition-all ${
                activeServiceId === service.id ? 'bg-neo-black text-white' : 'bg-white hover:bg-neo-cream'
              }`}
            >
              {service.logoEmoji} {service.name}
            </button>
          ))}
        </div>
      )}

      {memberships.length === 0 && !loading && (
        <div className="border-3 border-neo-black p-8 text-center bg-neo-cream">
          <p className="font-display font-bold">You need ADMIN role to manage subscriptions.</p>
        </div>
      )}

      {loading ? (
        <div className="border-3 border-neo-black p-10 text-center">
          <div className="w-8 h-8 border-3 border-neo-black border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : data ? (
        <>
          {/* Current Plan */}
          <div className={`border-3 border-neo-black shadow-brutal p-5 ${TIER_COLORS[tier]}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display font-bold text-xs uppercase tracking-widest text-neo-black/50 mb-1">Current Plan</p>
                <div className="flex items-center gap-2">
                  {TIER_ICONS[tier]}
                  <h2 className="font-display font-black text-2xl">{PLAN_LIMITS[tier].label}</h2>
                </div>
                {data.subscription.expiresAt && (
                  <p className="text-xs font-body text-neo-black/60 mt-1">
                    Expires {new Date(data.subscription.expiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Button variant="white" size="sm" onClick={loadSubscription} className="gap-1">
                <RefreshCw size={12} />
              </Button>
            </div>

            {/* Usage meters */}
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-display font-bold mb-1">
                  <span>Queries this month</span>
                  <span>
                    {data.queriesThisMonth}
                    {limits.queriesPerMonth !== null ? ` / ${limits.queriesPerMonth}` : ' (unlimited)'}
                  </span>
                </div>
                {limits.queriesPerMonth !== null && (
                  <div className="h-3 bg-white/50 border-2 border-neo-black">
                    <div
                      className={`h-full transition-all ${queryPercent >= 90 ? 'bg-red-500' : 'bg-neo-black'}`}
                      style={{ width: `${queryPercent}%` }}
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between text-xs font-display font-bold mb-1">
                  <span>Knowledge docs</span>
                  <span>
                    {data.knowledgeDocCount}
                    {limits.maxKnowledgeDocs !== null ? ` / ${limits.maxKnowledgeDocs}` : ' (unlimited)'}
                  </span>
                </div>
                {limits.maxKnowledgeDocs !== null && (
                  <div className="h-3 bg-white/50 border-2 border-neo-black">
                    <div
                      className={`h-full transition-all ${docPercent >= 90 ? 'bg-red-500' : 'bg-neo-black'}`}
                      style={{ width: `${docPercent}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-display font-bold">
                <span>Web search:</span>
                {limits.webSearch ? (
                  <span className="flex items-center gap-1 text-green-700"><CheckCircle size={12} /> Enabled</span>
                ) : (
                  <span className="text-neo-black/50">Disabled (PRO only)</span>
                )}
              </div>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['FREE', 'PRO'] as SubscriptionTier[]).map((planTier) => {
              const planLimits = PLAN_LIMITS[planTier];
              const isCurrent = tier === planTier;
              return (
                <div
                  key={planTier}
                  className={`border-3 border-neo-black p-4 flex flex-col gap-3 ${
                    isCurrent ? 'shadow-brutal ring-2 ring-neo-black' : 'bg-white'
                  } ${TIER_COLORS[planTier]}`}
                >
                  <div className="flex items-center gap-2">
                    {TIER_ICONS[planTier]}
                    <span className="font-display font-black text-lg">{planLimits.label}</span>
                    {isCurrent && (
                      <span className="ml-auto text-xs font-display font-bold bg-neo-black text-white px-2 py-0.5">
                        Current
                      </span>
                    )}
                  </div>

                  <ul className="space-y-1.5 text-xs font-body flex-1">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle size={11} className="text-green-600 shrink-0" />
                      {planLimits.queriesPerMonth !== null
                        ? `${planLimits.queriesPerMonth} queries/mo`
                        : 'Unlimited queries'}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle size={11} className="text-green-600 shrink-0" />
                      {planLimits.maxKnowledgeDocs !== null
                        ? `${planLimits.maxKnowledgeDocs} knowledge docs`
                        : 'Unlimited docs'}
                    </li>
                    <li className="flex items-center gap-1.5">
                      {planLimits.webSearch ? (
                        <CheckCircle size={11} className="text-green-600 shrink-0" />
                      ) : (
                        <span className="w-[11px] h-[11px] border-2 border-neo-black/30 rounded-full shrink-0" />
                      )}
                      <span className={planLimits.webSearch ? '' : 'text-neo-black/40'}>
                        Web search + RAG
                      </span>
                    </li>
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
