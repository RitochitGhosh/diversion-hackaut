'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Users, CheckCircle } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen bg-neo-cream overflow-hidden flex flex-col">
      {/* Ticker tape */}
      <div className="bg-neo-black text-neo-yellow border-b-3 border-neo-black py-2 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap gap-8">
          {Array(4).fill(null).map((_, i) => (
            <span key={i} className="flex items-center gap-8 font-display font-bold text-sm tracking-widest uppercase">
              <span>✦ Human-in-the-Loop AI</span>
              <span>✦ Multi-Tenant SaaS</span>
              <span>✦ AI Draft + Expert Review</span>
              <span>✦ Google Gemini Powered</span>
              <span>✦ Real-time Review Queue</span>
              <span>✦ Production Ready</span>
            </span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b-3 border-neo-black bg-white">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-neo-yellow border-3 border-neo-black shadow-brutal-sm flex items-center justify-center font-display font-black text-lg">
            R
          </div>
          <span className="font-display font-black text-xl tracking-tight">ReviewIQ</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="font-display font-bold text-sm hover:text-neo-black/60 transition-colors">Features</a>
          <a href="#how-it-works" className="font-display font-bold text-sm hover:text-neo-black/60 transition-colors">How It Works</a>
          <a href="#pricing" className="font-display font-bold text-sm hover:text-neo-black/60 transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/auth/login"
            className="neo-btn bg-white text-neo-black px-4 py-2 text-sm"
          >
            Login
          </a>
          <a
            href="/api/auth/login?returnTo=/dashboard"
            className="neo-btn bg-neo-yellow text-neo-black px-4 py-2 text-sm"
          >
            Get Started <ArrowRight size={14} />
          </a>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="flex-1 grid md:grid-cols-2 gap-0">
        {/* Left: Text */}
        <div className="flex flex-col justify-center px-8 md:px-16 py-16 border-r-3 border-neo-black">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-neo-green border-3 border-neo-black shadow-brutal-sm px-3 py-1.5 w-fit mb-8">
            <Zap size={14} className="fill-current" />
            <span className="font-display font-bold text-xs uppercase tracking-wider">AI + Human Expertise</span>
          </div>

          <h1 className="font-display font-black text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight mb-8">
            <span className="block">THE FUTURE</span>
            <span className="block bg-neo-yellow border-3 border-neo-black shadow-brutal px-3 py-1 -rotate-1 inline-block my-2">
              OF SMART
            </span>
            <span className="block">RESPONSES</span>
          </h1>

          <p className="font-body text-lg md:text-xl text-neo-black/70 mb-10 max-w-md leading-relaxed">
            AI drafts the answer. Your expert team reviews, edits, approves.
            Then AI crafts the perfect final response. <strong>HITL done right.</strong>
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="/api/auth/login?returnTo=/dashboard"
              className="neo-btn-yellow px-6 py-3.5 text-base gap-2"
            >
              Create Your Service
              <ArrowRight size={18} />
            </a>
            <a
              href="/api/auth/login?returnTo=/dashboard"
              className="neo-btn-black px-6 py-3.5 text-base"
            >
              Join as Reviewer
            </a>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-6 mt-12 pt-8 border-t-3 border-neo-black">
            <div className="flex -space-x-2">
              {['🧑', '👩', '👨', '🧑‍💻'].map((e, i) => (
                <div key={i} className="w-9 h-9 border-2 border-neo-black bg-white flex items-center justify-center text-sm">
                  {e}
                </div>
              ))}
            </div>
            <div>
              <div className="font-display font-black text-lg">500+ Teams</div>
              <div className="text-sm text-neo-black/60 font-body">using ReviewIQ today</div>
            </div>
          </div>
        </div>

        {/* Right: Visual */}
        <div className="relative hidden md:flex items-center justify-center bg-white p-12">
          {/* Decorative shapes */}
          <div className="absolute top-8 right-8 w-16 h-16 bg-neo-pink border-3 border-neo-black shadow-brutal animate-float" />
          <div className="absolute bottom-12 left-8 w-12 h-12 bg-neo-blue border-3 border-neo-black shadow-brutal animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/4 left-12 w-8 h-8 bg-neo-green border-3 border-neo-black rotate-45 shadow-brutal-sm animate-float" style={{ animationDelay: '4s' }} />

          {/* Mock HITL Flow */}
          <div className="w-full max-w-sm space-y-3">
            {/* Query Card */}
            <div className="border-3 border-neo-black shadow-brutal bg-neo-yellow p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="shrink-0" />
                <span className="font-display font-bold text-xs uppercase tracking-wide">User Query</span>
              </div>
              <p className="font-body text-sm">"How do I integrate OAuth 2.0 into my Next.js app?"</p>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center gap-2 py-1">
              <div className="h-px flex-1 border-t-3 border-dashed border-neo-black/40" />
              <span className="font-display font-bold text-xs bg-neo-purple border-3 border-neo-black px-2 py-1">AI DRAFTS</span>
              <div className="h-px flex-1 border-t-3 border-dashed border-neo-black/40" />
            </div>

            {/* AI Draft Card */}
            <div className="border-3 border-neo-black shadow-brutal bg-neo-blue p-4">
              <div className="font-display font-bold text-xs uppercase tracking-wide mb-2">⚡ AI Draft</div>
              <p className="font-body text-xs leading-relaxed text-neo-black/80 line-clamp-3">
                OAuth 2.0 integration in Next.js involves setting up an auth provider, configuring callbacks, and securing routes...
              </p>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center gap-2 py-1">
              <div className="h-px flex-1 border-t-3 border-dashed border-neo-black/40" />
              <span className="font-display font-bold text-xs bg-neo-pink border-3 border-neo-black px-2 py-1">HUMAN REVIEWS</span>
              <div className="h-px flex-1 border-t-3 border-dashed border-neo-black/40" />
            </div>

            {/* Review Card */}
            <div className="border-3 border-neo-black shadow-brutal bg-white p-4">
              <div className="font-display font-bold text-xs uppercase tracking-wide mb-3">👩‍💼 Expert Review</div>
              <div className="flex gap-2">
                <div className="border-2 border-neo-black bg-neo-green px-3 py-1 font-display font-bold text-xs">✓ Approve</div>
                <div className="border-2 border-neo-black bg-neo-yellow px-3 py-1 font-display font-bold text-xs">✎ Edit</div>
                <div className="border-2 border-neo-black bg-neo-orange px-3 py-1 font-display font-bold text-xs">✗ Reject</div>
              </div>
            </div>

            {/* Final Answer */}
            <div className="flex items-center justify-center gap-2 py-1">
              <div className="h-px flex-1 border-t-3 border-dashed border-neo-black/40" />
              <span className="font-display font-bold text-xs bg-neo-green border-3 border-neo-black px-2 py-1">FINAL ANSWER</span>
              <div className="h-px flex-1 border-t-3 border-dashed border-neo-black/40" />
            </div>

            <div className="border-3 border-neo-black shadow-brutal bg-neo-green p-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} />
                <span className="font-display font-bold text-sm">Detailed Answer Delivered</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-neo-black text-white border-t-3 border-neo-black grid grid-cols-3 md:grid-cols-3">
        {[
          { label: 'Avg Response Time', value: '< 30s' },
          { label: 'Review Accuracy', value: '99.2%' },
          { label: 'Services Created', value: '10K+' },
        ].map(({ label, value }, i) => (
          <div key={i} className={`p-5 text-center ${i < 2 ? 'border-r-3 border-white/20' : ''}`}>
            <div className="font-display font-black text-2xl md:text-3xl text-neo-yellow">{value}</div>
            <div className="text-white/60 text-xs font-body mt-1">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
