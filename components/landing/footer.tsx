export function Footer() {
  return (
    <footer className="bg-neo-black text-white border-t-3 border-neo-black">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b-3 border-white/20">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-neo-yellow border-3 border-white flex items-center justify-center font-display font-black text-neo-black text-lg">
                R
              </div>
              <span className="font-display font-black text-2xl">ReviewIQ</span>
            </div>
            <p className="font-body text-white/60 text-sm leading-relaxed max-w-xs">
              The Human-in-the-Loop AI platform for teams that care about accuracy.
              Built with Next.js, Auth0, and Google Gemini.
            </p>
            <div className="flex gap-3 mt-6">
              {['Twitter', 'GitHub', 'Discord'].map((s) => (
                <div key={s} className="border-2 border-white/20 hover:border-neo-yellow px-3 py-1.5 cursor-pointer transition-colors">
                  <span className="font-display font-bold text-xs text-white/60 hover:text-neo-yellow transition-colors">{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-black text-sm uppercase tracking-widest text-white/40 mb-4">Product</h4>
            <ul className="space-y-2">
              {['Features', 'How It Works', 'Pricing', 'Changelog', 'Roadmap'].map((l) => (
                <li key={l}>
                  <a href="#" className="font-body text-sm text-white/60 hover:text-neo-yellow transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-black text-sm uppercase tracking-widest text-white/40 mb-4">Company</h4>
            <ul className="space-y-2">
              {['About', 'Blog', 'Careers', 'Privacy Policy', 'Terms of Service'].map((l) => (
                <li key={l}>
                  <a href="#" className="font-body text-sm text-white/60 hover:text-neo-yellow transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6">
          <p className="font-body text-sm text-white/40">
            © 2026 ReviewIQ. Built with ❤️ using Next.js + Auth0 + Google Gemini.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neo-green animate-pulse" />
            <span className="font-display font-bold text-xs text-white/40">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
