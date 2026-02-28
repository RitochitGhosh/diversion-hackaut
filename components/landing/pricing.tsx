import { CheckCircle, Zap, Star, Crown } from 'lucide-react';

const plans = [
  {
    tier: 'Free',
    price: '0',
    unit: '',
    icon: Zap,
    color: 'bg-neo-cream',
    features: [
      '100 queries / month',
      '3 knowledge documents',
      'In-memory RAG',
      'Human review workflow',
      '1 service',
    ],
    locked: ['Web search integration'],
    cta: 'Get Started',
    href: '/api/auth/login',
  },
  {
    tier: 'Pro',
    price: '10',
    unit: 'ALGO / 30 days',
    icon: Star,
    color: 'bg-neo-blue',
    featured: true,
    features: [
      '2,000 queries / month',
      '50 knowledge documents',
      'Web search + RAG',
      'Human review workflow',
      'Up to 5 services',
    ],
    locked: [],
    cta: 'Upgrade to Pro',
    href: '/dashboard/subscription',
  },
  {
    tier: 'Enterprise',
    price: '25',
    unit: 'ALGO / 30 days',
    icon: Crown,
    color: 'bg-neo-purple',
    features: [
      'Unlimited queries',
      'Unlimited knowledge docs',
      'Web search + RAG',
      'Human review workflow',
      'Unlimited services',
    ],
    locked: [],
    cta: 'Upgrade to Enterprise',
    href: '/dashboard/subscription',
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-block border-3 border-neo-black bg-neo-yellow px-4 py-1 mb-4">
            <span className="font-display font-black text-sm uppercase tracking-widest">Pricing</span>
          </div>
          <h2 className="font-display font-black text-4xl md:text-5xl mb-4">
            Pay in <span className="relative inline-block px-1">
              <span className="relative z-10">ALGO</span>
              <span className="absolute inset-0 bg-neo-yellow border-3 border-neo-black -skew-x-3" />
              <span className="relative z-10">ALGO</span>
            </span>
          </h2>
          <p className="font-body text-lg text-neo-black/60 max-w-xl mx-auto">
            No credit cards. No hidden fees. Pay with Algorand — decentralized, transparent, instant.
          </p>
        </div>

        {/* Plan Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-3 border-neo-black">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.tier}
                className={`${plan.color} ${i < plans.length - 1 ? 'border-b-3 md:border-b-0 md:border-r-3 border-neo-black' : ''} p-6 flex flex-col gap-4 relative`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neo-black text-white font-display font-black text-xs px-3 py-1 border-3 border-neo-black whitespace-nowrap">
                    ★ MOST POPULAR
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 bg-neo-black text-white flex items-center justify-center border-3 border-neo-black">
                      <Icon size={16} />
                    </div>
                    <span className="font-display font-black text-xl">{plan.tier}</span>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-black text-4xl">{plan.price === '0' ? 'Free' : plan.price}</span>
                    {plan.unit && (
                      <span className="font-body text-sm text-neo-black/50">{plan.unit}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm font-body">
                      <CheckCircle size={14} className="text-green-600 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                  {plan.locked.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm font-body text-neo-black/35 line-through">
                      <span className="w-[14px] h-[14px] border-2 border-neo-black/20 rounded-full mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.href}
                  className={`flex items-center justify-center gap-2 px-4 py-3 border-3 border-neo-black font-display font-black text-sm transition-all ${
                    plan.featured
                      ? 'bg-neo-black text-white shadow-brutal hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5'
                      : 'bg-white hover:bg-neo-yellow hover:shadow-brutal-sm'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            );
          })}
        </div>

        {/* Algorand note */}
        <div className="mt-8 border-3 border-neo-black bg-neo-cream p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neo-black text-white flex items-center justify-center font-display font-black text-xs border-3 border-neo-black">
              Ⓐ
            </div>
            <span className="font-display font-bold text-sm">Powered by Algorand</span>
          </div>
          <p className="font-body text-sm text-neo-black/60 flex-1">
            Send ALGO to our wallet, paste your transaction ID, and your subscription activates instantly —
            verified on-chain via the Algorand Indexer.
          </p>
          <a
            href="https://algorand.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-display font-bold hover:underline text-neo-black/40"
          >
            algorand.com →
          </a>
        </div>
      </div>
    </section>
  );
}
