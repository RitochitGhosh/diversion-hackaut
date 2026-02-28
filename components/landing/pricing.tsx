import { Check, X, Zap, Star, Building2 } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: 0,
    icon: Zap,
    bg: 'bg-neo-cream',
    popular: false,
    cta: 'Get started free',
    ctaStyle: 'bg-white hover:bg-neo-yellow',
    href: '/api/auth/login',
    features: [
      { label: '1 service', included: true },
      { label: '3 reviewers / service', included: true },
      { label: '10 queries / month', included: true },
      { label: 'AI + human review pipeline', included: true },
      { label: 'Web search & RAG', included: true },
      { label: 'Image attachments', included: true },
      { label: 'Conversation history', included: true },
      { label: 'Priority support', included: false },
      { label: 'Custom integrations', included: false },
    ],
  },
  {
    name: 'Pro',
    price: 19,
    icon: Star,
    bg: 'bg-neo-yellow',
    popular: true,
    cta: 'Start Pro',
    ctaStyle: 'bg-neo-black text-white hover:bg-neo-black/80',
    href: '/api/auth/login',
    features: [
      { label: '5 services', included: true },
      { label: '20 reviewers / service', included: true },
      { label: '200 queries / month', included: true },
      { label: 'AI + human review pipeline', included: true },
      { label: 'Web search & RAG', included: true },
      { label: 'Image attachments', included: true },
      { label: 'Conversation history', included: true },
      { label: 'Priority support', included: true },
      { label: 'Custom integrations', included: false },
    ],
  },
  {
    name: 'Enterprise',
    price: 49,
    icon: Building2,
    bg: 'bg-neo-blue',
    popular: false,
    cta: 'Start Enterprise',
    ctaStyle: 'bg-white hover:bg-neo-yellow',
    href: '/api/auth/login',
    features: [
      { label: 'Unlimited services', included: true },
      { label: 'Unlimited reviewers', included: true },
      { label: 'Unlimited queries', included: true },
      { label: 'AI + human review pipeline', included: true },
      { label: 'Web search & RAG', included: true },
      { label: 'Image attachments', included: true },
      { label: 'Conversation history', included: true },
      { label: 'Priority support', included: true },
      { label: 'Custom integrations', included: true },
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 md:px-12 bg-white border-t-3 border-neo-black">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 border-3 border-neo-black bg-neo-black text-white px-4 py-2 mb-6 shadow-brutal-sm">
            <span className="font-display font-bold text-xs uppercase tracking-widest">Pricing</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-none">
              SIMPLE,
              <span className="block bg-neo-yellow border-3 border-neo-black shadow-brutal px-3 py-1 mt-2 w-fit">
                HONEST PRICING
              </span>
            </h2>
            <p className="font-body text-lg text-neo-black/60 max-w-sm md:ml-auto md:text-right">
              Start free and grow at your own pace.
              Upgrade or cancel anytime — no lock-in.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map(({ name, price, icon: Icon, bg, popular, cta, ctaStyle, href, features }) => (
            <div
              key={name}
              className={`relative border-3 border-neo-black flex flex-col ${bg} ${
                popular ? 'shadow-brutal-lg md:-translate-y-3' : 'shadow-brutal'
              }`}
            >
              {popular && (
                <div className="bg-neo-black text-neo-yellow font-display font-black text-xs uppercase tracking-widest text-center py-2 border-b-3 border-neo-black">
                  ★ Most Popular
                </div>
              )}

              {/* Plan header */}
              <div className="p-6 border-b-3 border-neo-black">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-white border-3 border-neo-black shadow-brutal-sm flex items-center justify-center shrink-0">
                    <Icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className="font-display font-black text-2xl">{name}</span>
                </div>
                {price === 0 ? (
                  <span className="font-display font-black text-5xl leading-none">Free</span>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="font-display font-black text-5xl leading-none">${price}</span>
                    <span className="font-body text-neo-black/50 pb-1">/mo</span>
                  </div>
                )}
              </div>

              {/* Feature list */}
              <ul className="p-6 space-y-2.5 flex-1">
                {features.map(({ label, included }) => (
                  <li key={label} className="flex items-center gap-2.5 text-sm font-body">
                    {included ? (
                      <span className="w-4 h-4 shrink-0 bg-neo-black flex items-center justify-center">
                        <Check size={10} strokeWidth={3} className="text-white" />
                      </span>
                    ) : (
                      <span className="w-4 h-4 shrink-0 border-2 border-neo-black/20 flex items-center justify-center">
                        <X size={10} strokeWidth={2.5} className="text-neo-black/25" />
                      </span>
                    )}
                    <span className={included ? '' : 'text-neo-black/35'}>{label}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="p-6 pt-2">
                <a
                  href={href}
                  className={`flex items-center justify-center w-full py-3 border-3 border-neo-black font-display font-black text-sm shadow-brutal-sm hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all ${ctaStyle}`}
                >
                  {cta} →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ strip */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your billing dashboard — no questions, no penalties.' },
            { q: 'What counts as a query?', a: 'Every message a user submits that goes through the AI + review pipeline counts as one query.' },
            { q: 'Do unused queries roll over?', a: 'Limits reset monthly. Unused queries do not carry over to the next period.' },
          ].map(({ q, a }) => (
            <div key={q} className="border-3 border-neo-black bg-neo-cream p-4">
              <p className="font-display font-bold text-sm mb-1">{q}</p>
              <p className="font-body text-xs text-neo-black/60 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
