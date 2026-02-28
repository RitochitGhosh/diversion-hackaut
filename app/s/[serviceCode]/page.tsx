'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import {
  Send, LogIn, RefreshCw, Paperclip, X, Loader2,
  ImageIcon, CheckCircle2, Clock, XCircle, Sparkles, Bot, User,
} from 'lucide-react';
import type { QueryWithReview } from '@/types';
import { formatDate } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceInfo {
  id: string; serviceCode: string; name: string; description: string | null;
  logoEmoji: string; _count: { members: number; queries: number };
}
interface MemberInfo { id: string; role: string; serviceId: string; }
interface UploadedImage {
  file: File; preview: string; url: string | null; error: string | null; uploading: boolean;
}

const ACCEPTED = 'image/jpeg,image/png,image/gif,image/webp';
const MAX_IMAGES = 3;

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'ANSWERED')
    return <span className="inline-flex items-center gap-1 text-[10px] font-display font-black border-2 border-neo-black bg-neo-green px-2 py-0.5 uppercase tracking-wide"><CheckCircle2 size={10} /> Answered</span>;
  if (status === 'REJECTED')
    return <span className="inline-flex items-center gap-1 text-[10px] font-display font-black border-2 border-neo-black bg-red-400 px-2 py-0.5 uppercase tracking-wide"><XCircle size={10} /> Rejected</span>;
  if (status === 'PENDING_REVIEW')
    return <span className="inline-flex items-center gap-1 text-[10px] font-display font-black border-2 border-neo-black bg-neo-yellow px-2 py-0.5 uppercase tracking-wide"><Clock size={10} /> Under review</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-display font-black border-2 border-neo-black bg-neo-cream px-2 py-0.5 uppercase tracking-wide"><Loader2 size={10} className="animate-spin" /> Processing</span>;
}

// ─── Single Q&A thread ───────────────────────────────────────────────────────

function QueryThread({ query }: { query: QueryWithReview }) {
  const [showAllImages, setShowAllImages] = useState(false);
  const imageUrls = (query.imageUrls as string[] | null) ?? [];
  const answer = query.finalAnswer ?? (query.status !== 'PENDING_AI' ? query.aiDraft : null);
  const isAnswered = query.status === 'ANSWERED';

  return (
    <div className="space-y-3">
      {/* User message — right aligned */}
      <div className="flex justify-end gap-2">
        <div className="max-w-[80%] space-y-2">
          {/* Attached images */}
          {imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {(showAllImages ? imageUrls : imageUrls.slice(0, 2)).map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="attachment" className="w-24 h-24 object-cover border-3 border-neo-black cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(url, '_blank')} />
              ))}
              {!showAllImages && imageUrls.length > 2 && (
                <button onClick={() => setShowAllImages(true)} className="w-24 h-24 border-3 border-neo-black bg-neo-cream font-display font-bold text-xs flex items-center justify-center hover:bg-neo-yellow transition-colors">
                  +{imageUrls.length - 2} more
                </button>
              )}
            </div>
          )}
          <div className="bg-neo-black text-white border-3 border-neo-black px-4 py-3 font-body text-sm leading-relaxed">
            {query.content}
          </div>
          <div className="flex items-center justify-end gap-2">
            <StatusBadge status={query.status} />
            <span className="font-mono text-[10px] text-neo-black/40">{formatDate(new Date(query.createdAt))}</span>
          </div>
        </div>
        <div className="w-8 h-8 border-3 border-neo-black bg-neo-yellow flex items-center justify-center shrink-0 mt-0.5">
          <User size={13} className="text-neo-black" />
        </div>
      </div>

      {/* AI/Reviewer answer — left aligned */}
      {answer ? (
        <div className="flex gap-2">
          <div className="w-8 h-8 border-3 border-neo-black bg-neo-blue flex items-center justify-center shrink-0 mt-0.5">
            <Bot size={13} className="text-neo-black" />
          </div>
          <div className="max-w-[80%]">
            {!isAnswered && (
              <p className="font-display font-bold text-[10px] text-neo-black/50 uppercase tracking-wide mb-1 ml-1">
                AI Draft — awaiting expert review
              </p>
            )}
            <div className={`border-3 border-neo-black px-4 py-3 font-body text-sm leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto ${isAnswered ? 'bg-white' : 'bg-neo-yellow/40'}`}>
              {answer}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="w-8 h-8 border-3 border-neo-black bg-neo-cream flex items-center justify-center shrink-0">
            <Loader2 size={13} className="animate-spin" />
          </div>
          <div className="border-3 border-neo-black/30 border-dashed bg-neo-cream px-4 py-3 font-body text-sm text-neo-black/50 italic">
            Researching your question…
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ServicePage({ params }: { params: { serviceCode: string } }) {
  const { user, isLoading: authLoading } = useUser();
  const [service, setService] = useState<ServiceInfo | null>(null);
  const [membership, setMembership] = useState<MemberInfo | null>(null);
  const [queries, setQueries] = useState<QueryWithReview[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    async function load() {
      setPageLoading(true);
      try {
        const res = await fetch(`/api/service-page/${params.serviceCode}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Service not found');
        setService(data.service);
        setMembership(data.membership ?? null);
      } catch (err) {
        setPageError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setPageLoading(false);
      }
    }
    load();
  }, [params.serviceCode, authLoading, user]);

  const loadQueries = useCallback(async () => {
    if (!service || !membership) return;
    try {
      const res = await fetch(`/api/queries?serviceId=${service.id}&mine=true`);
      const data = await res.json();
      if (res.ok) setQueries(data.queries ?? []);
    } catch {}
  }, [service, membership]);

  useEffect(() => { loadQueries(); }, [loadQueries]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [queries.length]);

  // ── Image upload ───────────────────────────────────────────────────────────
  async function uploadOne(img: UploadedImage, index: number) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET;
    if (!cloudName || !preset) {
      setImages((prev) => prev.map((im, i) => i === index ? { ...im, error: 'Upload not configured', uploading: false } : im));
      return;
    }
    try {
      const fd = new FormData();
      fd.append('file', img.file);
      fd.append('upload_preset', preset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error?.message ?? 'Upload failed');
      setImages((prev) => prev.map((im, i) => i === index ? { ...im, url: data.secure_url, uploading: false } : im));
    } catch (err) {
      setImages((prev) => prev.map((im, i) => i === index ? { ...im, error: err instanceof Error ? err.message : 'Upload failed', uploading: false } : im));
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_IMAGES - images.length);
    if (!files.length) return;
    const newImages: UploadedImage[] = files.map((file) => ({
      file, preview: URL.createObjectURL(file), url: null, error: null, uploading: true,
    }));
    const startIdx = images.length;
    setImages((prev) => [...prev, ...newImages]);
    newImages.forEach((img, idx) => uploadOne(img, startIdx + idx));
    e.target.value = '';
  }

  function removeImage(index: number) {
    setImages((prev) => { URL.revokeObjectURL(prev[index].preview); return prev.filter((_, i) => i !== index); });
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!content.trim() || submitting || !service || !membership) return;
    if (images.some((im) => im.uploading)) { setSubmitError('Wait for images to finish uploading.'); return; }
    if (images.some((im) => im.error)) { setSubmitError('Remove failed images before submitting.'); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      const imageUrls = images.map((im) => im.url).filter(Boolean) as string[];
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), serviceId: service.id, imageUrls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit');
      setContent('');
      setImages([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      loadQueries();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading / error states ─────────────────────────────────────────────────
  if (pageLoading || authLoading) {
    return (
      <div className="min-h-screen bg-neo-cream flex items-center justify-center">
        <div className="border-3 border-neo-black shadow-brutal bg-white p-8 text-center">
          <div className="w-10 h-10 border-3 border-neo-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-display font-bold">Loading service…</p>
        </div>
      </div>
    );
  }

  if (pageError || !service) {
    return (
      <div className="min-h-screen bg-neo-cream flex items-center justify-center">
        <div className="border-3 border-neo-black shadow-brutal-lg bg-neo-orange p-8 text-center max-w-md">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="font-display font-black text-2xl mb-2">Service Not Found</h1>
          <p className="font-body text-sm text-neo-black/70">{pageError || 'This service code does not exist.'}</p>
          <a href="/" className="inline-flex items-center mt-6 border-3 border-neo-black bg-neo-black text-white px-5 py-2.5 font-display font-bold shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
            ← Back Home
          </a>
        </div>
      </div>
    );
  }

  const canAttach = images.length < MAX_IMAGES;

  return (
    <div className="min-h-screen bg-neo-cream flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-neo-black text-white border-b-3 border-neo-black">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 border-3 border-white bg-neo-yellow flex items-center justify-center text-xl shrink-0">
              {service.logoEmoji}
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-black text-base leading-tight truncate">{service.name}</h1>
              {service.description && (
                <p className="font-body text-xs text-white/50 truncate hidden sm:block">{service.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {membership && (
              <span className="font-display font-bold text-[10px] border-2 border-white/30 px-2 py-0.5 text-white/60 hidden md:block uppercase tracking-wide">
                {membership.role}
              </span>
            )}
            {user ? (
              <a href="/api/auth/logout" className="font-body text-xs text-white/50 hover:text-white transition-colors">Sign out</a>
            ) : (
              <a
                href={`/api/auth/login?returnTo=/s/${params.serviceCode}`}
                className="flex items-center gap-1.5 font-display font-bold text-sm border-3 border-neo-yellow bg-neo-yellow text-neo-black px-3 py-1.5 shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                <LogIn size={14} /> Sign in
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── Chat body ──────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 pb-4">

        {/* Not signed in */}
        {!user && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-6xl mb-4">{service.logoEmoji}</div>
            <div className="border-3 border-neo-black shadow-brutal bg-neo-yellow p-8 max-w-sm w-full">
              <h2 className="font-display font-black text-2xl mb-2">{service.name}</h2>
              {service.description && <p className="font-body text-sm text-neo-black/70 mb-6">{service.description}</p>}
              <a
                href={`/api/auth/login?returnTo=/s/${params.serviceCode}`}
                className="flex items-center justify-center gap-2 border-3 border-neo-black bg-neo-black text-white px-6 py-3 font-display font-bold shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <LogIn size={18} /> Sign in to ask questions
              </a>
            </div>
          </div>
        )}

        {/* Empty state */}
        {user && queries.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="border-3 border-neo-black shadow-brutal bg-neo-blue p-8 max-w-sm w-full">
              <div className="w-14 h-14 border-3 border-neo-black bg-neo-yellow flex items-center justify-center mx-auto mb-4">
                <Sparkles size={26} />
              </div>
              <h2 className="font-display font-black text-xl mb-2">Ask {service.name}</h2>
              <p className="font-body text-sm text-neo-black/60">
                Your question will be AI-researched and reviewed by a human expert before you receive an answer.
              </p>
            </div>
          </div>
        )}

        {/* Conversation threads */}
        {user && queries.length > 0 && (
          <div className="space-y-8">
            {[...queries].reverse().map((q) => (
              <QueryThread key={q.id} query={q} />
            ))}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Sticky input ───────────────────────────────────────────────────── */}
      {user && (
        <div className="sticky bottom-0 bg-neo-cream border-t-3 border-neo-black">
          <div className="max-w-3xl mx-auto px-4 py-3 space-y-2">

            {/* Image previews */}
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative w-14 h-14 border-3 border-neo-black overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    {img.uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 size={14} className="text-white animate-spin" /></div>}
                    {img.error && <div className="absolute inset-0 bg-red-700/80 flex items-center justify-center"><X size={12} className="text-white" /></div>}
                    {img.url && <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-neo-green border-2 border-white flex items-center justify-center"><span className="text-[8px] font-black">✓</span></span>}
                    {!img.uploading && (
                      <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 w-4 h-4 bg-neo-black flex items-center justify-center hover:bg-red-600 transition-colors">
                        <X size={8} className="text-white" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {submitError && (
              <div className="border-3 border-red-600 bg-red-50 px-3 py-2">
                <p className="font-display font-bold text-xs text-red-700">{submitError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              {/* Main input box */}
              <div className="flex-1 flex items-end gap-2 border-3 border-neo-black bg-white px-3 py-2.5 shadow-brutal-sm focus-within:shadow-brutal transition-shadow">
                <input ref={fileInputRef} type="file" accept={ACCEPTED} multiple className="hidden" onChange={handleFileChange} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canAttach}
                  title={canAttach ? 'Attach images (max 3)' : 'Max 3 images'}
                  className="text-neo-black/40 hover:text-neo-black disabled:opacity-30 transition-colors shrink-0 mb-0.5"
                >
                  {images.length > 0
                    ? <span className="flex items-center gap-0.5 text-[11px] font-display font-bold text-neo-black"><ImageIcon size={14} /> {images.length}/{MAX_IMAGES}</span>
                    : <Paperclip size={16} />
                  }
                </button>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything… (⌘↵ to send)"
                  rows={1}
                  className="flex-1 resize-none bg-transparent outline-none font-body text-sm leading-relaxed max-h-[160px] placeholder:text-neo-black/30"
                />
              </div>

              {/* Refresh */}
              <button
                type="button"
                onClick={loadQueries}
                title="Refresh answers"
                className="w-10 h-10 border-3 border-neo-black bg-white flex items-center justify-center text-neo-black hover:bg-neo-cream shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all shrink-0"
              >
                <RefreshCw size={14} />
              </button>

              {/* Send */}
              <button
                type="submit"
                disabled={!content.trim() || images.some((im) => im.uploading) || submitting || !membership}
                className="w-10 h-10 border-3 border-neo-black bg-neo-black text-white flex items-center justify-center hover:bg-neo-black/80 disabled:opacity-40 disabled:cursor-not-allowed shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all shrink-0"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </form>

            <p className="text-center font-mono text-[10px] text-neo-black/40 pb-1">
              AI-researched · Expert-reviewed · ⌘↵ to send
            </p>
          </div>
        </div>
      )}

      {/* Footer (not logged in) */}
      {!user && (
        <footer className="border-t-3 border-neo-black bg-neo-black text-white/40 py-4 text-center">
          <p className="font-body text-xs">
            Powered by <a href="/" className="text-neo-yellow font-bold hover:underline">ReviewIQ</a>
          </p>
        </footer>
      )}
    </div>
  );
}
