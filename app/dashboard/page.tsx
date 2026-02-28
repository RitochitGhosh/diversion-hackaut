import { getSession } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Plus, Users, ArrowRight, Clipboard } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect('/api/auth/login');

  const { sub: userId, name, email, picture } = session.user;

  const memberships = await db.serviceMember.findMany({
    where: { userId },
    include: {
      service: {
        include: {
          _count: { select: { members: true, queries: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // If user has no service, show onboarding
  if (memberships.length === 0) {
    return <OnboardingPage name={name} />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Welcome */}
      <div className="border-3 border-neo-black shadow-brutal bg-neo-yellow p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-black text-2xl md:text-3xl mb-1">
              Welcome back{name ? `, ${name.split(' ')[0]}` : ''}! 👋
            </h1>
            <p className="font-body text-neo-black/60">{email}</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href="/dashboard/admin?action=create"
              className="neo-btn-black px-4 py-2 text-sm gap-1"
            >
              <Plus size={14} /> New Service
            </Link>
          </div>
        </div>
      </div>

      {/* Services */}
      <div>
        <h2 className="font-display font-black text-xl mb-4 flex items-center gap-2">
          <Users size={20} /> Your Services
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {memberships.map(({ id, role, service, createdAt }) => (
            <div key={id} className="border-3 border-neo-black shadow-brutal bg-white hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all group">
              <div className={`p-4 border-b-3 border-neo-black ${role === 'ADMIN' ? 'bg-neo-yellow' : 'bg-neo-blue'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{service.logoEmoji}</span>
                    <div>
                      <h3 className="font-display font-black text-lg leading-tight">{service.name}</h3>
                      <span className="font-mono text-xs bg-neo-black text-white px-2 py-0.5">{service.serviceCode}</span>
                    </div>
                  </div>
                  <span className={`font-display font-black text-xs px-2 py-1 border-2 border-neo-black ${role === 'ADMIN' ? 'bg-white' : 'bg-white'}`}>
                    {role}
                  </span>
                </div>
              </div>
              <div className="p-4">
                {service.description && (
                  <p className="font-body text-sm text-neo-black/60 mb-3 line-clamp-2">{service.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm font-display font-bold">
                  <span>{service._count.members} members</span>
                  <span>{service._count.queries} queries</span>
                  <span className="ml-auto text-xs font-body text-neo-black/40">Joined {formatDate(createdAt)}</span>
                </div>
              </div>
              <div className="flex border-t-3 border-neo-black">
                <Link
                  href={`/dashboard/queries?serviceId=${service.id}`}
                  className="flex-1 py-2.5 text-center font-display font-bold text-sm hover:bg-neo-yellow transition-colors border-r-3 border-neo-black"
                >
                  Queries
                </Link>
                <Link
                  href={`/dashboard/reviewer?serviceId=${service.id}`}
                  className="flex-1 py-2.5 text-center font-display font-bold text-sm hover:bg-neo-blue transition-colors flex items-center justify-center gap-1"
                >
                  Review Queue <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}

          {/* Add new service card */}
          <Link
            href="/dashboard/admin?action=create"
            className="border-3 border-neo-black border-dashed p-6 flex flex-col items-center justify-center gap-3 hover:bg-neo-cream transition-colors min-h-[160px]"
          >
            <div className="w-12 h-12 border-3 border-neo-black flex items-center justify-center">
              <Plus size={24} />
            </div>
            <span className="font-display font-bold text-sm">Create New Service</span>
          </Link>
        </div>
      </div>

      {/* Join a service */}
      <div className="border-3 border-neo-black shadow-brutal bg-neo-green p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-black text-lg">Have a Service Code?</h3>
            <p className="font-body text-sm text-neo-black/60">Join an existing service as a reviewer</p>
          </div>
          <Link href="/dashboard/admin?action=join" className="neo-btn-black px-4 py-2 text-sm shrink-0">
            Join Service
          </Link>
        </div>
      </div>
    </div>
  );
}

function OnboardingPage({ name }: { name?: string }) {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="border-3 border-neo-black shadow-brutal-lg bg-neo-yellow p-8 text-center mb-6">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="font-display font-black text-3xl mb-3">
          Welcome{name ? `, ${name.split(' ')[0]}` : ''}!
        </h1>
        <p className="font-body text-neo-black/70 max-w-md mx-auto">
          You&apos;re all set with ReviewIQ. Get started by creating your first service or joining an existing one.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/dashboard/admin?action=create" className="group">
          <div className="border-3 border-neo-black shadow-brutal bg-white p-6 hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all h-full">
            <div className="w-12 h-12 bg-neo-black text-white border-3 border-neo-black flex items-center justify-center text-xl mb-4">
              ✦
            </div>
            <h2 className="font-display font-black text-xl mb-2">Create a Service</h2>
            <p className="font-body text-sm text-neo-black/60 mb-4">
              Launch your own HITL service. Get a unique ID to share with your reviewer team.
            </p>
            <span className="font-display font-bold text-sm flex items-center gap-1">
              Get started <ArrowRight size={14} />
            </span>
          </div>
        </Link>

        <Link href="/dashboard/admin?action=join" className="group">
          <div className="border-3 border-neo-black shadow-brutal bg-neo-blue p-6 hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all h-full">
            <div className="w-12 h-12 bg-neo-black text-white border-3 border-neo-black flex items-center justify-center text-xl mb-4">
              <Users size={22} className="text-white" />
            </div>
            <h2 className="font-display font-black text-xl mb-2">Join as Reviewer</h2>
            <p className="font-body text-sm text-neo-black/60 mb-4">
              Have a service code? Join an existing team and start reviewing AI responses.
            </p>
            <span className="font-display font-bold text-sm flex items-center gap-1">
              Enter code <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
