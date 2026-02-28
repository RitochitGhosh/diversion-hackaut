'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Zap, CheckCircle, Star, AlertCircle, Copy, ExternalLink,
  RefreshCw, ArrowUpCircle, Shield,
} from 'lucide-react';
import { PLAN_LIMITS, PLAN_PRICE_ALGO } from '@/lib/subscription';
import type { SubscriptionTier } from '@/lib/subscription';

const RECEIVER_ADDRESS = process.env.NEXT_PUBLIC_ALGORAND_RECEIVER_ADDRESS ?? '';
const NETWORK = process.env.NEXT_PUBLIC_ALGORAND_NETWORK ?? 'testnet';

interface SubscriptionData {
  id: string;
  tier: SubscriptionTier;
  algoTxId: string | null;
  walletAddress: string | null;
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

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [txId, setTxId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');
  const [copied, setCopied] = useState(false);

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

  function copyAddress() {
    navigator.clipboard.writeText(RECEIVER_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!txId.trim() || !activeServiceId || verifying) return;

    setVerifying(true);
    setVerifyError('');
    setVerifySuccess('');

    try {
      const res = await fetch('/api/subscription/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: activeServiceId, tier: 'PRO', txId: txId.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Verification failed');

      setVerifySuccess(json.message);
      setTxId('');
      setShowUpgrade(false);
      loadSubscription();
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }

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
          Manage your plan. Payments are made in ALGO on the Algorand {NETWORK}.
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

      {verifySuccess && (
        <div className="border-3 border-neo-black bg-neo-green p-4 shadow-brutal-sm flex items-start gap-2">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <p className="font-display font-bold text-sm">{verifySuccess}</p>
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
              const isPaid = planTier === 'PRO';
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

                  <p className="font-display font-black text-2xl">
                    {isPaid ? (
                      <>{PLAN_PRICE_ALGO} ALGO<span className="text-xs font-body font-normal text-neo-black/50"> /30 days</span></>
                    ) : (
                      'Free'
                    )}
                  </p>

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

                  {!isCurrent && isPaid && (
                    <Button
                      variant="black"
                      size="sm"
                      onClick={() => {
                        setShowUpgrade(true);
                        setVerifyError('');
                        setVerifySuccess('');
                      }}
                      className="w-full gap-1"
                    >
                      <ArrowUpCircle size={13} /> Upgrade
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Upgrade Form */}
          {showUpgrade && (
            <div className="border-3 border-neo-black shadow-brutal bg-white">
              <div className="flex items-center justify-between px-5 py-4 border-b-3 border-neo-black bg-neo-black text-white">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle size={16} />
                  <span className="font-display font-black">Upgrade to Pro</span>
                </div>
                <button
                  onClick={() => { setShowUpgrade(false); setVerifyError(''); }}
                  className="text-white/50 hover:text-white text-xs font-display font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Step 1: Send ALGO */}
                <div className="border-3 border-neo-black bg-neo-cream p-4">
                  <p className="font-display font-black text-sm mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-neo-black text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    Send {PLAN_PRICE_ALGO} ALGO to this address
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-xs bg-white border-2 border-neo-black p-2 break-all">
                      {RECEIVER_ADDRESS || 'RECEIVER_ADDRESS_NOT_CONFIGURED'}
                    </code>
                    {RECEIVER_ADDRESS && (
                      <Button variant="black" size="sm" onClick={copyAddress} className="shrink-0">
                        {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs font-body text-neo-black/50">
                      Network: <strong>{NETWORK}</strong> · Amount: <strong>{PLAN_PRICE_ALGO} ALGO</strong>
                    </span>
                    <a
                      href={`https://${NETWORK === 'mainnet' ? '' : NETWORK + '.'}algoexplorer.io/address/${RECEIVER_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-1 text-xs font-display font-bold hover:underline"
                    >
                      <ExternalLink size={11} /> AlgoExplorer
                    </a>
                  </div>
                </div>

                {/* Step 2: Paste TX ID */}
                <div>
                  <p className="font-display font-black text-sm mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-neo-black text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    Paste your Transaction ID
                  </p>
                  <form onSubmit={handleVerify} className="space-y-3">
                    <Input
                      placeholder="e.g. TXID5XP7EAMOKWV7VSVS7OOVF3CJKFM7YIP3..."
                      value={txId}
                      onChange={(e) => setTxId(e.target.value)}
                      className="font-mono text-sm"
                    />

                    {verifyError && (
                      <div className="border-3 border-red-500 bg-red-50 p-3 flex items-start gap-2">
                        <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                        <p className="font-display font-bold text-sm text-red-700">{verifyError}</p>
                      </div>
                    )}

                    <div className="border-3 border-neo-black bg-neo-cream p-3">
                      <p className="text-xs font-body text-neo-black/60">
                        We verify your transaction on the Algorand {NETWORK} indexer. Subscription activates for 30 days once confirmed.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      variant="black"
                      loading={verifying}
                      disabled={!txId.trim()}
                      className="w-full gap-2"
                    >
                      <Shield size={14} />
                      {verifying ? 'Verifying on Algorand...' : 'Verify & Activate Subscription'}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
