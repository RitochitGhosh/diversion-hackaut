'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Users, Plus, Hash } from 'lucide-react';

const EMOJIS = ['🏢', '🚀', '💡', '🔬', '🎯', '⚡', '🌟', '🔧', '📊', '🎨'];

export default function AdminPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const action = searchParams.get('action') ?? 'view';

  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'view' | 'create' | 'join'>(
    action === 'create' ? 'create' : action === 'join' ? 'join' : 'view'
  );

  // Create service form
  const [createForm, setCreateForm] = useState({ name: '', description: '', logoEmoji: '🏢' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdService, setCreatedService] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Join service form
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinedService, setJoinedService] = useState<any>(null);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (res.ok) setMemberships(data.memberships ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadServices(); }, [loadServices]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: createForm.name,
          description: createForm.description,
          logoEmoji: createForm.logoEmoji,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCreatedService(data.service);
      loadServices();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create service');
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoining(true);
    setJoinError('');
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceCode: joinCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJoinedService(data.membership.service);
      loadServices();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join service');
    } finally {
      setJoining(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="border-3 border-neo-black shadow-brutal bg-neo-yellow p-5">
        <h1 className="font-display font-black text-2xl mb-1">Service Management</h1>
        <p className="font-body text-sm text-neo-black/60">Create services or join existing ones as a reviewer.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-3 border-neo-black">
        {[
          { key: 'view', label: 'My Services' },
          { key: 'create', label: '+ Create Service' },
          { key: 'join', label: 'Join Service' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex-1 py-3 font-display font-bold text-sm border-r-3 last:border-r-0 border-neo-black transition-colors ${
              tab === key ? 'bg-neo-black text-white' : 'bg-white hover:bg-neo-cream'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* My Services Tab */}
      {tab === 'view' && (
        <div className="space-y-4">
          {loading ? (
            <div className="border-3 border-neo-black p-8 text-center">
              <div className="w-8 h-8 border-3 border-neo-black border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : memberships.length === 0 ? (
            <div className="border-3 border-neo-black p-8 text-center bg-neo-cream">
              <p className="font-display font-bold text-lg mb-2">No services yet</p>
              <p className="font-body text-sm text-neo-black/50">Create a service or join one with a code.</p>
            </div>
          ) : (
            memberships.map(({ id, role, service }: any) => (
              <div key={id} className="border-3 border-neo-black shadow-brutal bg-white">
                <div className={`flex items-center gap-3 p-4 border-b-3 border-neo-black ${role === 'ADMIN' ? 'bg-neo-yellow' : 'bg-neo-blue'}`}>
                  <span className="text-2xl">{service.logoEmoji}</span>
                  <div className="flex-1">
                    <h3 className="font-display font-black text-lg">{service.name}</h3>
                    <p className="text-xs font-body text-neo-black/60">{service.description}</p>
                  </div>
                  <Badge variant={role === 'ADMIN' ? 'black' : 'white'}>{role}</Badge>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 border-3 border-neo-black bg-neo-cream p-3 mb-3">
                    <Hash size={14} />
                    <span className="font-mono font-bold text-sm flex-1">{service.serviceCode}</span>
                    <button
                      onClick={() => copyCode(service.serviceCode)}
                      className="flex items-center gap-1 font-display font-bold text-xs border-2 border-neo-black px-3 py-1.5 hover:bg-neo-yellow transition-colors"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-display">
                    <span className="flex items-center gap-1"><Users size={13} /> {service._count.members} members</span>
                    <span>{service._count.queries} queries</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Service Tab */}
      {tab === 'create' && (
        <div className="border-3 border-neo-black shadow-brutal bg-white">
          <CardHeader className="bg-neo-black text-white">
            <h2 className="font-display font-black text-lg flex items-center gap-2"><Plus size={18} /> Create New Service</h2>
          </CardHeader>
          <CardContent className="p-5">
            {createdService ? (
              <div className="space-y-4">
                <div className="border-3 border-neo-black bg-neo-green p-5 text-center">
                  <div className="text-4xl mb-2">{createdService.logoEmoji}</div>
                  <h3 className="font-display font-black text-xl mb-1">Service Created!</h3>
                  <p className="font-body text-sm text-neo-black/60">{createdService.name}</p>
                </div>
                <div className="border-3 border-neo-black bg-neo-yellow p-4">
                  <p className="font-display font-bold text-sm mb-2">Your Service Code — Share this with your team!</p>
                  <div className="flex items-center gap-3 bg-white border-3 border-neo-black p-3">
                    <span className="font-mono font-black text-xl flex-1 tracking-widest">{createdService.serviceCode}</span>
                    <button
                      onClick={() => copyCode(createdService.serviceCode)}
                      className="neo-btn-black px-4 py-2 text-sm gap-1"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs font-body text-neo-black/50 mt-2">
                    Reviewers use this code to join your service. Keep it safe!
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="yellow" onClick={() => { setCreatedService(null); setCreateForm({ name: '', description: '', logoEmoji: '🏢' }); }} className="flex-1">Create Another</Button>
                  <Button variant="black" onClick={() => router.push('/dashboard/reviewer')} className="flex-1">Go to Review Queue</Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                {/* Emoji picker */}
                <div>
                  <label className="block font-display font-bold text-sm mb-2">Service Logo</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setCreateForm(f => ({ ...f, logoEmoji: emoji }))}
                        className={`w-10 h-10 border-3 text-xl flex items-center justify-center transition-all ${
                          createForm.logoEmoji === emoji
                            ? 'border-neo-black bg-neo-yellow shadow-brutal-sm'
                            : 'border-transparent hover:border-neo-black'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  label="Service Name *"
                  placeholder="e.g., Acme Corp Support"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
                <Textarea
                  label="Description"
                  placeholder="What does your service do?"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
                {createError && (
                  <div className="border-3 border-red-600 bg-red-50 p-3">
                    <p className="font-display font-bold text-sm text-red-700">{createError}</p>
                  </div>
                )}
                <Button type="submit" variant="yellow" loading={creating} className="w-full">
                  Create Service & Get Code
                </Button>
              </form>
            )}
          </CardContent>
        </div>
      )}

      {/* Join Service Tab */}
      {tab === 'join' && (
        <div className="border-3 border-neo-black shadow-brutal bg-white">
          <CardHeader className="bg-neo-blue">
            <h2 className="font-display font-black text-lg flex items-center gap-2"><Users size={18} /> Join as Reviewer</h2>
          </CardHeader>
          <CardContent className="p-5">
            {joinedService ? (
              <div className="space-y-4">
                <div className="border-3 border-neo-black bg-neo-green p-5 text-center">
                  <div className="text-4xl mb-2">{joinedService.logoEmoji}</div>
                  <h3 className="font-display font-black text-xl mb-1">Joined Successfully!</h3>
                  <p className="font-body">{joinedService.name}</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="black" onClick={() => router.push('/dashboard/reviewer')} className="flex-1">
                    Go to Review Queue →
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="border-3 border-neo-black bg-neo-cream p-4">
                  <p className="font-body text-sm text-neo-black/70">
                    Ask the service admin for their Service Code (looks like <code className="font-mono font-bold">SVC-AB12CD34</code>). Enter it below to join as a Reviewer.
                  </p>
                </div>
                <Input
                  label="Service Code *"
                  placeholder="SVC-XXXXXXXX"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="font-mono font-bold tracking-widest text-lg"
                  required
                />
                {joinError && (
                  <div className="border-3 border-red-600 bg-red-50 p-3">
                    <p className="font-display font-bold text-sm text-red-700">{joinError}</p>
                  </div>
                )}
                <Button type="submit" variant="blue" loading={joining} className="w-full">
                  Join Service
                </Button>
              </form>
            )}
          </CardContent>
        </div>
      )}
    </div>
  );
}
