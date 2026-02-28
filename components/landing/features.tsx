import { Shield, Zap, Users, GitBranch, Brain, Globe } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Google Gemini Powered',
    description: 'Gemini Flash for rapid initial drafts. Gemini Pro for rich, detailed final answers. Best-in-class AI at every step.',
    color: 'yellow' as const,
    rotate: '-rotate-1',
  },
  {
    icon: Users,
    title: 'Multi-Tenant Architecture',
    description: 'Create isolated services with unique IDs. Each team gets their own workspace, members, and review queue.',
    color: 'blue' as const,
    rotate: 'rotate-1',
  },
  {
    icon: GitBranch,
    title: 'Human-in-the-Loop',
    description: 'Every AI response goes through expert human review. Edit, approve, or reject before the final answer is generated.',
    color: 'pink' as const,
    rotate: '-rotate-1',
  },
  {
    icon: Shield,
    title: 'Auth0 Security',
    description: 'Enterprise-grade authentication. OAuth, social logins, MFA — all handled. Your users are always protected.',
    color: 'green' as const,
    rotate: 'rotate-1',
  },
  {
    icon: Zap,
    title: 'Real-time Review Queue',
    description: 'Reviewers see incoming queries live. No polling delays. Process reviews in seconds, not hours.',
    color: 'purple' as const,
    rotate: '-rotate-1',
  },
  {
    icon: Globe,
    title: 'Unique Service IDs',
    description: 'Every service gets a unique code like SVC-AB12CD34. Share it with your team to get them onboarded instantly.',
    color: 'orange' as const,
    rotate: 'rotate-1',
  },
];

const bgColors = {
  yellow: 'bg-neo-yellow',
  blue: 'bg-neo-blue',
  pink: 'bg-neo-pink',
  green: 'bg-neo-green',
  purple: 'bg-neo-purple',
  orange: 'bg-neo-orange',
};

export function Features() {
  return (
    <section id="features" className="py-24 px-6 md:px-12 bg-white border-t-3 border-neo-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 border-3 border-neo-black bg-neo-black text-white px-4 py-2 mb-6 shadow-brutal-sm">
            <span className="font-display font-bold text-xs uppercase tracking-widest">Platform Features</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-none max-w-xl">
              EVERYTHING YOU
              <span className="block bg-neo-yellow border-3 border-neo-black shadow-brutal px-3 py-1 mt-2 inline-block">
                NEED
              </span>
            </h2>
            <p className="font-body text-lg text-neo-black/60 max-w-md md:ml-auto md:text-right">
              A complete platform for building human-AI collaborative services.
              No compromises, no missing pieces.
            </p>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description, color, rotate }, i) => (
            <div
              key={i}
              className={`border-3 border-neo-black shadow-brutal p-6 ${bgColors[color]} ${rotate} hover:rotate-0 transition-transform duration-200`}
            >
              <div className="w-12 h-12 bg-white border-3 border-neo-black shadow-brutal-sm flex items-center justify-center mb-5">
                <Icon size={22} strokeWidth={2.5} />
              </div>
              <h3 className="font-display font-black text-xl mb-3">{title}</h3>
              <p className="font-body text-sm leading-relaxed text-neo-black/75">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
