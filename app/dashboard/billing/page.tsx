'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreditCard, Check, Zap, Building2, Star, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Plan {
  id: string;
  label: string;
  price: number;
  maxServices: number;
  maxReviewers: number;
  maxQueriesPerMonth: number;
}

interface BillingData {
  plan: Plan;
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    lsCustomerId: string | null;
  } | null;
  ownedServices: number;
  plans: Record<string, Plan>;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  FREE: <Zap size={20} />,
  PRO: <Star size={20} />,
  ENTERPRISE: <Building2 size={20} />,
};

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-neo-cream',
  PRO: 'bg-neo-yellow',
  ENTERPRISE: 'bg-neo-blue',
};

function formatLimit(val: number): string {
  return val === Infinity ? 'Unlimited' : String(val);
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const justUpgraded = searchParams.get('success') === 'true';

  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/billing');
      if (res.ok) setData(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  async function handleUpgrade(planId: string) {
    setUpgrading(planId);
    setError('');
    try {
      const res = await fetch('/api/lemonsqueezy/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create checkout');
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setUpgrading(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-10 h-10 border-3 border-neo-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentPlanId = data?.plan.id ?? 'FREE';
  const plans = data ? Object.values(data.plans) : [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-3 border-neo-black shadow-brutal bg-neo-yellow p-5">
        <h1 className="font-display font-black text-2xl mb-1 flex items-center gap-2">
          <CreditCard size={22} /> Billing & Plans
        </h1>
        <p className="font-body text-sm text-neo-black/60">
          Manage your subscription and usage limits.
        </p>
      </div>

      {/* Success banner */}
      {justUpgraded && (
        <div className="border-3 border-neo-black bg-neo-green p-4 shadow-brutal-sm">
          <p className="font-display font-black text-base flex items-center gap-2">
            <Check size={18} /> Plan upgraded successfully! Your new limits are now active.
          </p>
        </div>
      )}

      {error && (
        <div className="border-3 border-red-600 bg-red-50 p-4">
          <p className="font-display font-bold text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </p>
        </div>
      )}

      {/* Current plan summary */}
      {data && (
        <div className="border-3 border-neo-black shadow-brutal bg-white p-5">
          <p className="font-display font-bold text-xs uppercase tracking-widest text-neo-black/40 mb-3">
            Current Plan
          </p>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 border-3 border-neo-black flex items-center justify-center ${PLAN_COLORS[currentPlanId]}`}>
              {PLAN_ICONS[currentPlanId]}
            </div>
            <div>
              <p className="font-display font-black text-xl">{data.plan.label}</p>
              {data.subscription?.currentPeriodEnd && (
                <p className="font-body text-sm text-neo-black/50">
                  Renews {new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}
                  {data.subscription.status === 'cancelled' && ' (cancels at end of period)'}
                </p>
              )}
            </div>
            {data.subscription?.lsCustomerId && currentPlanId !== 'FREE' && (
              <button
                onClick={() => handleUpgrade(currentPlanId)}
                className="ml-auto flex items-center gap-1.5 text-xs font-display font-bold border-3 border-neo-black px-3 py-2 hover:bg-neo-cream transition-colors"
              >
                <ExternalLink size={12} /> Manage Subscription
              </button>
            )}
          </div>

          {/* Usage stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Services', used: data.ownedServices, max: data.plan.maxServices },
              { label: 'Reviewers/service', used: null, max: data.plan.maxReviewers },
              { label: 'Queries/month', used: null, max: data.plan.maxQueriesPerMonth },
            ].map(({ label, used, max }) => (
              <div key={label} className="border-3 border-neo-black p-3 bg-neo-cream">
                <p className="font-display font-bold text-xs uppercase tracking-wide text-neo-black/40 mb-1">
                  {label}
                </p>
                <p className="font-display font-black text-lg">
                  {used !== null ? `${used} / ` : ''}{formatLimit(max)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan comparison */}
      <div>
        <p className="font-display font-bold text-xs uppercase tracking-widest text-neo-black/40 mb-3">
          Available Plans
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isDowngrade = plan.price < (data?.plan.price ?? 0);
            return (
              <div
                key={plan.id}
                className={`border-3 border-neo-black p-5 flex flex-col gap-4 transition-shadow ${
                  isCurrent ? 'shadow-brutal-lg bg-neo-yellow' : 'shadow-brutal bg-white'
                }`}
              >
                {/* Plan header */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 border-3 border-neo-black flex items-center justify-center ${PLAN_COLORS[plan.id]}`}>
                      {PLAN_ICONS[plan.id]}
                    </div>
                    <div>
                      <p className="font-display font-black text-lg leading-none">{plan.label}</p>
                      {isCurrent && (
                        <span className="text-[10px] font-display font-bold bg-neo-black text-white px-1.5">
                          CURRENT
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="font-display font-black text-3xl">
                    {plan.price === 0 ? (
                      'Free'
                    ) : (
                      <>
                        ${plan.price}
                        <span className="text-sm font-body font-normal text-neo-black/50">/mo</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1">
                  {[
                    { label: `${formatLimit(plan.maxServices)} service${plan.maxServices === 1 ? '' : 's'}` },
                    { label: `${formatLimit(plan.maxReviewers)} reviewer${plan.maxReviewers === 1 ? '' : 's'} per service` },
                    { label: `${formatLimit(plan.maxQueriesPerMonth)} queries/month` },
                    { label: 'Image attachments' },
                    { label: 'AI + human review pipeline' },
                    ...(plan.id !== 'FREE' ? [{ label: 'Priority support' }] : []),
                    ...(plan.id === 'ENTERPRISE' ? [{ label: 'Custom integrations' }] : []),
                  ].map(({ label }) => (
                    <li key={label} className="flex items-start gap-2 text-sm font-body">
                      <Check size={14} className="shrink-0 mt-0.5 text-green-600" />
                      {label}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {!isCurrent && !isDowngrade && plan.id !== 'FREE' && (
                  <Button
                    variant="black"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgrading !== null}
                    className="w-full justify-center gap-2"
                  >
                    {upgrading === plan.id ? (
                      <><Loader2 size={14} className="animate-spin" /> Redirecting…</>
                    ) : (
                      <>Upgrade to {plan.label} <ExternalLink size={13} /></>
                    )}
                  </Button>
                )}
                {isCurrent && (
                  <div className="border-3 border-neo-black bg-neo-black text-white text-center py-2 font-display font-bold text-sm">
                    Your current plan
                  </div>
                )}
                {!isCurrent && plan.id === 'FREE' && (
                  <div className="border-3 border-neo-black/30 text-neo-black/40 text-center py-2 font-display font-bold text-sm">
                    Downgrade via support
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
