import { getSession } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/dashboard/navbar';
import { db } from '@/lib/db';
import Link from 'next/link';
import { LayoutDashboard, ClipboardList, MessageSquare, Settings, Users } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/api/auth/login');

  const { sub: userId } = session.user;

  // Get user's active service (most recently joined/created)
  const membership = await db.serviceMember.findFirst({
    where: { userId },
    include: {
      service: {
        include: { _count: { select: { members: true, queries: true } } },
      },
    },
    orderBy: { createdAt: 'asc' }, // Prefer first created (usually their own service)
  });

  const navLinks = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/reviewer', label: 'Review Queue', icon: ClipboardList },
    { href: '/dashboard/queries', label: 'My Queries', icon: MessageSquare },
    ...(membership?.role === 'ADMIN'
      ? [{ href: '/dashboard/admin', label: 'Admin', icon: Settings }]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neo-cream">
      <Navbar
        serviceName={membership?.service.name}
        serviceCode={membership?.service.serviceCode}
        role={membership?.role}
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r-3 border-neo-black bg-white hidden md:flex flex-col">
          <nav className="p-3 flex-1">
            <p className="font-display font-bold text-xs uppercase tracking-widest text-neo-black/30 px-3 py-2">Navigation</p>
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 font-display font-bold text-sm hover:bg-neo-yellow border-3 border-transparent hover:border-neo-black hover:shadow-brutal-sm transition-all mb-1"
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>

          {membership && (
            <div className="p-3 border-t-3 border-neo-black">
              <div className="border-3 border-neo-black bg-neo-cream p-3">
                <p className="font-display font-bold text-xs uppercase tracking-wide mb-1">Service Code</p>
                <p className="font-mono font-bold text-sm text-neo-black">{membership.service.serviceCode}</p>
                <p className="text-xs text-neo-black/50 font-body mt-1">Share to invite reviewers</p>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-3 border-neo-black flex md:hidden z-40">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-3 font-display font-bold text-xs hover:bg-neo-yellow transition-colors"
            >
              <Icon size={18} />
              {label.split(' ')[0]}
            </Link>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
