const steps = [
  {
    number: '01',
    title: 'Create Your Service',
    description: 'Sign up and create a service in seconds. You\'ll receive a unique Service ID like SVC-AB12CD34. Share it with your team of expert reviewers.',
    who: 'Admin',
    bg: 'bg-neo-yellow',
    detail: 'Configure your service name, add a description, and your unique code is automatically generated.',
  },
  {
    number: '02',
    title: 'Reviewers Join',
    description: 'Your expert team signs up and enters the Service ID. They\'re instantly onboarded as Reviewers with access to the review queue.',
    who: 'Reviewer',
    bg: 'bg-neo-blue',
    detail: 'Reviewers authenticate via Auth0 and are immediately ready to start processing queries.',
  },
  {
    number: '03',
    title: 'User Asks a Query',
    description: 'Any service member submits a question through the dashboard. The query is immediately sent to Google Gemini for an initial draft.',
    who: 'User',
    bg: 'bg-neo-pink',
    detail: 'Gemini Flash generates a fast, focused draft response in seconds. The query enters the review queue.',
  },
  {
    number: '04',
    title: 'Expert Reviews AI Draft',
    description: 'A reviewer sees the query and AI draft side-by-side. They can Approve as-is, Edit the content, or Reject with reasoning.',
    who: 'Reviewer',
    bg: 'bg-neo-green',
    detail: 'Reviewers can add context notes explaining their changes, which are used to guide the final AI response.',
  },
  {
    number: '05',
    title: 'AI Generates Final Answer',
    description: 'Google Gemini Pro takes the reviewed content and generates a comprehensive, detailed final answer — perfectly calibrated by human expertise.',
    who: 'AI',
    bg: 'bg-neo-purple',
    detail: 'The final answer uses markdown formatting, includes examples, considerations, and a thorough explanation.',
  },
  {
    number: '06',
    title: 'User Gets Their Answer',
    description: 'The user sees the final, expert-validated answer. Every response is accurate, thorough, and human-approved.',
    who: 'User',
    bg: 'bg-neo-orange',
    detail: 'Full query history is maintained. Users can track the status of their queries in real-time.',
  },
];

const whoColors: Record<string, string> = {
  Admin: 'bg-neo-black text-white',
  Reviewer: 'bg-white text-neo-black border-neo-black',
  User: 'bg-neo-yellow text-neo-black border-neo-black',
  AI: 'bg-neo-purple text-neo-black border-neo-black',
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 md:px-12 bg-neo-cream border-t-3 border-neo-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex border-3 border-neo-black bg-neo-pink px-4 py-2 mb-6 shadow-brutal-sm">
            <span className="font-display font-bold text-xs uppercase tracking-widest">The HITL Process</span>
          </div>
          <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-none">
            HOW IT
            <span className="inline-block bg-neo-black text-white border-3 border-neo-black shadow-brutal px-3 py-1 ml-3">
              WORKS
            </span>
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-[2.5rem] top-0 bottom-0 w-0.5 bg-neo-black hidden md:block" />

          <div className="space-y-6">
            {steps.map(({ number, title, description, who, bg, detail }, i) => (
              <div key={i} className="relative flex gap-6 md:gap-10 items-start">
                {/* Number circle */}
                <div className={`relative z-10 shrink-0 w-20 h-20 border-3 border-neo-black ${bg} shadow-brutal flex items-center justify-center`}>
                  <span className="font-display font-black text-2xl">{number}</span>
                </div>

                {/* Content */}
                <div className={`flex-1 border-3 border-neo-black shadow-brutal ${bg} p-5 md:p-6`}>
                  <div className="flex flex-wrap items-start gap-3 mb-3">
                    <h3 className="font-display font-black text-xl">{title}</h3>
                    <span className={`neo-badge border-2 ${whoColors[who]}`}>
                      {who === 'Admin' ? '🔑' : who === 'Reviewer' ? '👩‍💼' : who === 'User' ? '💬' : '🤖'} {who}
                    </span>
                  </div>
                  <p className="font-body text-neo-black/80 leading-relaxed mb-3">{description}</p>
                  <div className="bg-white/50 border-2 border-neo-black/20 p-3">
                    <p className="text-xs font-body text-neo-black/60">{detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 border-3 border-neo-black shadow-brutal-lg bg-neo-black text-white p-8 md:p-12 text-center">
          <h3 className="font-display font-black text-3xl md:text-4xl mb-4">
            Ready to build your <span className="text-neo-yellow">HITL service?</span>
          </h3>
          <p className="font-body text-white/70 mb-8 max-w-md mx-auto">
            Get started in minutes. No credit card required.
          </p>
          <a
            href="/api/auth/login?returnTo=/dashboard"
            className="neo-btn bg-neo-yellow text-neo-black px-8 py-4 text-lg inline-flex items-center gap-2"
          >
            Create Free Service →
          </a>
        </div>
      </div>
    </section>
  );
}
