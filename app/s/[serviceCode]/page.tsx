'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import {
  Send, LogIn, RefreshCw, Paperclip, X, Loader2,
  ImageIcon, CheckCircle2, Clock, XCircle, Sparkles,
  Bot, User, Globe, BookOpen, Search, Brain, ChevronDown, ChevronUp,
  Mic, MicOff, Volume2, Square,
} from 'lucide-react';
import type { QueryWithReview, Source, AgentLog } from '@/types';
import { formatDate } from '@/lib/utils';
import { RichAnswer } from '@/components/ui/rich-answer';

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
    return <span className="inline-flex items-center gap-1 text-[10px] font-display font-black border-2 border-neo-black bg-neo-yellow px-2 py-0.5 uppercase tracking-wide"><Clock size={10} /> Under Review</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-display font-black border-2 border-neo-black bg-neo-cream px-2 py-0.5 uppercase tracking-wide"><Loader2 size={10} className="animate-spin" /> Processing</span>;
}

function getStateDescription(status: string): string {
  switch (status) {
    case 'PENDING_AI': return 'AI is actively researching your question.';
    case 'PENDING_REVIEW': return 'AI draft ready — awaiting expert human review.';
    case 'ANSWERED': return 'Reviewed and verified by a human expert.';
    case 'REJECTED': return 'This query was not approved.';
    default: return '';
  }
}

// ─── Query Output Card ────────────────────────────────────────────────────────

function QueryCard({ query }: { query: QueryWithReview }) {
  const [showAllImages, setShowAllImages] = useState(false);
  const [draftExpanded, setDraftExpanded] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handleListen(text: string) {
    if (ttsPlaying) {
      audioRef.current?.pause();
      setTtsPlaying(false);
      return;
    }
    setTtsLoading(true);
    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setTtsPlaying(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setTtsPlaying(false); };
      await audio.play();
      setTtsPlaying(true);
    } catch {
      setTtsPlaying(false);
    } finally {
      setTtsLoading(false);
    }
  }

  const imageUrls = (query.imageUrls as string[] | null) ?? [];
  const sources = (query.sources as Source[] | null) ?? [];
  const agentLog = query.agentLog as AgentLog | null;

  const isAnswered = query.status === 'ANSWERED';
  const isRejected = query.status === 'REJECTED';
  const isPendingReview = query.status === 'PENDING_REVIEW';

  const webSources = sources.filter((s) => s.type === 'web');
  const ragSources = sources.filter((s) => s.type === 'rag');
  const hasWebActivity = agentLog?.usedSearch || webSources.length > 0;

  return (
    <div className="border-3 border-neo-black shadow-brutal bg-white overflow-hidden">

      {/* ── Card header: query content ─────────────────────────────────────── */}
      <div className="border-b-3 border-neo-black bg-neo-black px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-7 h-7 border-2 border-white/30 bg-neo-yellow flex items-center justify-center shrink-0 mt-0.5">
            <User size={12} className="text-neo-black" />
          </div>
          <p className="font-body text-sm leading-relaxed text-white/90">{query.content}</p>
        </div>
        <span className="font-mono text-[10px] text-white/40 shrink-0 whitespace-nowrap mt-1">
          {formatDate(new Date(query.createdAt))}
        </span>
      </div>

      {/* ── Attached images ────────────────────────────────────────────────── */}
      {imageUrls.length > 0 && (
        <div className="border-b-3 border-neo-black px-4 py-3 flex gap-2 flex-wrap bg-neo-cream/40">
          {(showAllImages ? imageUrls : imageUrls.slice(0, 3)).map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i} src={url} alt="attachment"
              className="w-20 h-20 object-cover border-2 border-neo-black cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.open(url, '_blank')}
            />
          ))}
          {!showAllImages && imageUrls.length > 3 && (
            <button
              onClick={() => setShowAllImages(true)}
              className="w-20 h-20 border-2 border-neo-black bg-neo-cream font-display font-bold text-xs flex items-center justify-center hover:bg-neo-yellow transition-colors"
            >
              +{imageUrls.length - 3} more
            </button>
          )}
        </div>
      )}

      {/* ── Current State ──────────────────────────────────────────────────── */}
      <div className="border-b-3 border-neo-black px-4 py-3 flex items-center gap-3 bg-neo-cream/30">
        <span className="font-display font-black text-[10px] uppercase tracking-widest text-neo-black/40 shrink-0 w-24">
          State
        </span>
        <div className="flex items-center gap-2.5 flex-wrap">
          <StatusBadge status={query.status} />
          <span className="font-body text-xs text-neo-black/55">{getStateDescription(query.status)}</span>
        </div>
      </div>

      {/* ── AI Research / Draft ────────────────────────────────────────────── */}
      {query.aiDraft && (
        <div className="border-b-3 border-neo-black">
          <button
            onClick={() => setDraftExpanded((v) => !v)}
            className="w-full px-4 py-2.5 bg-neo-blue/15 flex items-center gap-2 hover:bg-neo-blue/25 transition-colors"
          >
            <Brain size={12} className="text-neo-black/50 shrink-0" />
            <span className="font-display font-black text-[10px] uppercase tracking-widest text-neo-black/50 flex-1 text-left">
              AI Research Draft
            </span>
            {isPendingReview && (
              <span className="font-mono text-[10px] text-neo-yellow border border-neo-yellow px-1.5 py-0.5 mr-1">
                Awaiting review
              </span>
            )}
            {draftExpanded ? <ChevronUp size={13} className="text-neo-black/40" /> : <ChevronDown size={13} className="text-neo-black/40" />}
          </button>
          {draftExpanded && (
            <div className="px-4 py-3 max-h-52 overflow-y-auto bg-white">
              <p className="font-body text-sm leading-relaxed text-neo-black/70 whitespace-pre-wrap">{query.aiDraft}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Web Sources ────────────────────────────────────────────────────── */}
      {hasWebActivity && (
        <div className="border-b-3 border-neo-black">
          <div className="px-4 py-2.5 bg-neo-yellow/20 flex items-center gap-2">
            <Globe size={12} className="text-neo-black/50 shrink-0" />
            <span className="font-display font-black text-[10px] uppercase tracking-widest text-neo-black/50 flex-1">
              Web Sources
            </span>
            {agentLog?.searchQuery && (
              <span className="flex items-center gap-1 font-mono text-[10px] text-neo-black/40">
                <Search size={9} /> &ldquo;{agentLog.searchQuery}&rdquo;
              </span>
            )}
          </div>
          {webSources.length > 0 ? (
            <div className="px-4 py-3 space-y-3 max-h-44 overflow-y-auto">
              {webSources.map((src, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 border-2 border-neo-black bg-neo-yellow flex items-center justify-center shrink-0 mt-0.5 font-display font-black text-[9px]">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    {src.url ? (
                      <a
                        href={src.url} target="_blank" rel="noopener noreferrer"
                        className="font-display font-bold text-xs hover:underline text-neo-black block truncate"
                      >
                        {src.title}
                      </a>
                    ) : (
                      <span className="font-display font-bold text-xs text-neo-black">{src.title}</span>
                    )}
                    <p className="font-body text-[11px] text-neo-black/50 leading-relaxed mt-0.5 line-clamp-2">{src.excerpt}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3">
              <p className="font-body text-xs text-neo-black/40 italic">Web search performed — detailed sources not recorded.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Knowledge Base Sources ─────────────────────────────────────────── */}
      {ragSources.length > 0 && (
        <div className="border-b-3 border-neo-black">
          <div className="px-4 py-2.5 bg-neo-green/15 flex items-center gap-2">
            <BookOpen size={12} className="text-neo-black/50 shrink-0" />
            <span className="font-display font-black text-[10px] uppercase tracking-widest text-neo-black/50 flex-1">
              Knowledge Base
            </span>
            <span className="font-mono text-[10px] text-neo-black/40">{ragSources.length} doc{ragSources.length > 1 ? 's' : ''}</span>
          </div>
          <div className="px-4 py-3 space-y-1.5">
            {ragSources.map((src, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-neo-black/30 mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <span className="font-display font-bold text-xs text-neo-black">{src.title}</span>
                  {src.excerpt && (
                    <p className="font-body text-[11px] text-neo-black/50 leading-relaxed mt-0.5 line-clamp-2">{src.excerpt}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Final Answer ───────────────────────────────────────────────────── */}
      {(isAnswered || isRejected) && (
        <div>
          <div className={`px-4 py-2.5 flex items-center gap-2 ${isAnswered ? 'bg-neo-green/20' : 'bg-red-50'}`}>
            <Bot size={12} className="text-neo-black/50 shrink-0" />
            <span className="font-display font-black text-[10px] uppercase tracking-widest text-neo-black/50 flex-1">
              {isAnswered ? 'Final Answer' : 'Rejection Note'}
            </span>
            {query.review?.reviewer && (
              <span className="font-mono text-[10px] text-neo-black/40 mr-2">
                by {query.review.reviewer.name ?? query.review.reviewer.email}
              </span>
            )}
            {isAnswered && query.finalAnswer && (
              <button
                onClick={() => handleListen(query.finalAnswer!)}
                disabled={ttsLoading}
                title={ttsPlaying ? 'Stop listening' : 'Listen to answer'}
                className={`flex items-center gap-1 border-2 border-neo-black px-2 py-0.5 font-display font-black text-[10px] uppercase tracking-wide transition-all disabled:opacity-40
                  ${ttsPlaying ? 'bg-neo-black text-white' : 'bg-white hover:bg-neo-yellow'}`}
              >
                {ttsLoading
                  ? <Loader2 size={10} className="animate-spin" />
                  : ttsPlaying
                    ? <><Square size={10} /> Stop</>
                    : <><Volume2 size={10} /> Listen</>
                }
              </button>
            )}
          </div>
          <div className="px-4 py-4 max-h-80 overflow-y-auto bg-white">
            {isAnswered && query.finalAnswer ? (
              <RichAnswer content={query.finalAnswer} />
            ) : (
              <p className="font-body text-sm text-neo-black/70 italic leading-relaxed">
                {query.review?.note ?? 'No reason provided.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Still processing — no draft yet ───────────────────────────────── */}
      {!isAnswered && !isRejected && !query.aiDraft && (
        <div className="px-4 py-4 flex items-center gap-2.5">
          <Loader2 size={14} className="animate-spin text-neo-black/30 shrink-0" />
          <p className="font-body text-sm text-neo-black/40 italic">AI is actively researching your question…</p>
        </div>
      )}
    </div>
  );
}

// ─── Chat Input Panel ─────────────────────────────────────────────────────────

interface ChatInputProps {
  content: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onRefresh: () => void;
  images: UploadedImage[];
  onAttach: () => void;
  onRemoveImage: (i: number) => void;
  canAttach: boolean;
  submitting: boolean;
  membershipReady: boolean;
  submitError: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Voice
  recording: boolean;
  transcribing: boolean;
  onToggleRecording: () => void;
}

function ChatInputPanel({
  content, onChange, onKeyDown, onSubmit, onRefresh,
  images, onAttach, onRemoveImage, canAttach,
  submitting, membershipReady, submitError,
  textareaRef, fileInputRef, onFileChange,
  recording, transcribing, onToggleRecording,
}: ChatInputProps) {
  return (
    <div className="border-3 border-neo-black shadow-brutal bg-white">
      {/* Input header */}
      <div className="border-b-3 border-neo-black bg-neo-black px-4 py-2 flex items-center gap-2">
        <Sparkles size={13} className="text-neo-yellow" />
        <span className="font-display font-black text-xs text-white uppercase tracking-wide">Ask a Question</span>
        <span className="ml-auto font-mono text-[10px] text-white/30">⌘↵ to send</span>
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="border-b-3 border-neo-black px-4 py-3 flex gap-2 flex-wrap bg-neo-cream/40">
          {images.map((img, i) => (
            <div key={i} className="relative w-14 h-14 border-2 border-neo-black overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.preview} alt="" className="w-full h-full object-cover" />
              {img.uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 size={14} className="text-white animate-spin" />
                </div>
              )}
              {img.error && (
                <div className="absolute inset-0 bg-red-700/80 flex items-center justify-center">
                  <X size={12} className="text-white" />
                </div>
              )}
              {img.url && (
                <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-neo-green border-2 border-white flex items-center justify-center">
                  <span className="text-[8px] font-black">✓</span>
                </span>
              )}
              {!img.uploading && (
                <button
                  onClick={() => onRemoveImage(i)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-neo-black flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X size={8} className="text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Textarea area */}
      <div className="px-4 py-3">
        <input ref={fileInputRef} type="file" accept={ACCEPTED} multiple className="hidden" onChange={onFileChange} />
        <textarea
          ref={textareaRef}
          value={content}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Type your question here… Attach images if relevant."
          rows={7}
          className="w-full resize-none bg-transparent outline-none font-body text-sm leading-relaxed placeholder:text-neo-black/30"
        />
      </div>

      {/* Error */}
      {submitError && (
        <div className="border-t-3 border-red-600 bg-red-50 px-4 py-2">
          <p className="font-display font-bold text-xs text-red-700">{submitError}</p>
        </div>
      )}

      {/* Action bar */}
      <div className="border-t-3 border-neo-black px-4 py-2.5 flex items-center gap-2 bg-neo-cream/30">
        {/* Attach */}
        <button
          type="button"
          onClick={onAttach}
          disabled={!canAttach}
          title={canAttach ? 'Attach images (max 3)' : 'Max 3 images'}
          className="flex items-center gap-1.5 border-2 border-neo-black px-2.5 py-1.5 font-display font-bold text-[11px] hover:bg-neo-yellow disabled:opacity-30 transition-colors"
        >
          {images.length > 0
            ? <><ImageIcon size={13} /> {images.length}/{MAX_IMAGES}</>
            : <><Paperclip size={13} /> Attach</>
          }
        </button>

        {/* Mic / Voice input */}
        <button
          type="button"
          onClick={onToggleRecording}
          disabled={transcribing}
          title={recording ? 'Stop recording' : 'Ask by voice'}
          className={`flex items-center gap-1.5 border-2 border-neo-black px-2.5 py-1.5 font-display font-black text-[11px] transition-all disabled:opacity-40
            ${recording ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'hover:bg-neo-blue/20'}`}
        >
          {transcribing
            ? <><Loader2 size={13} className="animate-spin" /> Transcribing…</>
            : recording
              ? <><MicOff size={13} /> Stop</>
              : <><Mic size={13} /> Voice</>
          }
        </button>

        <div className="flex-1" />

        {/* Refresh */}
        <button
          type="button"
          onClick={onRefresh}
          title="Refresh answers"
          className="w-9 h-9 border-2 border-neo-black bg-white flex items-center justify-center hover:bg-neo-cream shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        >
          <RefreshCw size={13} />
        </button>

        {/* Send */}
        <button
          type="button"
          onClick={() => onSubmit()}
          disabled={!content.trim() || images.some((im) => im.uploading) || submitting || !membershipReady}
          className="flex items-center gap-2 border-2 border-neo-black bg-neo-black text-white px-4 py-1.5 font-display font-bold text-[11px] hover:bg-neo-black/80 disabled:opacity-40 disabled:cursor-not-allowed shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        >
          {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          {submitting ? 'Sending…' : 'Send'}
        </button>
      </div>
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
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  // ── Image upload ────────────────────────────────────────────────────────────
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
      await loadQueries();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Voice recording ─────────────────────────────────────────────────────────
  async function toggleRecording() {
    if (recording) {
      // Stop — triggers ondataavailable + onstop
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        setTranscribing(true);
        try {
          const fd = new FormData();
          fd.append('audio', blob, 'recording.webm');
          const res = await fetch('/api/voice/stt', { method: 'POST', body: fd });
          const data = await res.json();
          if (res.ok && data.text) {
            setContent((prev) => (prev ? prev + ' ' + data.text : data.text));
          }
        } catch {
          // silently ignore — user can retry
        } finally {
          setTranscribing(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      alert('Microphone access denied. Please allow microphone permissions and try again.');
    }
  }

  // ── Loading / error states ──────────────────────────────────────────────────
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
  const sortedQueries = [...queries].reverse();

  return (
    <div className="min-h-screen bg-neo-cream">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-neo-black text-white border-b-3 border-neo-black">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
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

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">

        {/* Not signed in — centred */}
        {!user && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
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

        {/* Signed in — two-column split */}
        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">

            {/* ── LEFT: Chat input — sticky ─────────────────────────────────── */}
            <div className="lg:sticky lg:top-[65px]">
              <ChatInputPanel
                content={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                onSubmit={handleSubmit}
                onRefresh={loadQueries}
                images={images}
                onAttach={() => fileInputRef.current?.click()}
                onRemoveImage={removeImage}
                canAttach={canAttach}
                submitting={submitting}
                membershipReady={!!membership}
                submitError={submitError}
                textareaRef={textareaRef}
                fileInputRef={fileInputRef}
                onFileChange={handleFileChange}
                recording={recording}
                transcribing={transcribing}
                onToggleRecording={toggleRecording}
              />
              {/* Hint text below input */}
              <p className="mt-3 text-center font-mono text-[10px] text-neo-black/35">
                AI-researched · Expert-reviewed · ⌘↵ to send
              </p>
            </div>

            {/* ── RIGHT: Query output cards ─────────────────────────────────── */}
            <div className="space-y-5 min-w-0">

              {/* Section label */}
              <div className="flex items-center gap-3">
                <span className="font-display font-black text-[10px] uppercase tracking-widest text-neo-black/40">
                  Responses
                </span>
                <div className="flex-1 border-t-2 border-neo-black/10" />
                {sortedQueries.length > 0 && (
                  <span className="font-mono text-[10px] text-neo-black/30">{sortedQueries.length}</span>
                )}
              </div>

              {/* Empty state */}
              {sortedQueries.length === 0 && (
                <div className="border-3 border-neo-black border-dashed bg-white/50 px-6 py-16 flex flex-col items-center text-center">
                  <div className="w-14 h-14 border-3 border-neo-black bg-neo-blue flex items-center justify-center mb-4">
                    <Sparkles size={24} />
                  </div>
                  <p className="font-display font-bold text-base mb-1">No responses yet</p>
                  <p className="font-body text-sm text-neo-black/50">
                    Submit a question on the left. Answers appear here once AI-researched and expert-reviewed.
                  </p>
                </div>
              )}

              {/* Cards */}
              {sortedQueries.map((q) => (
                <QueryCard key={q.id} query={q} />
              ))}
            </div>

          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t-3 border-neo-black bg-neo-black text-white/30 py-4 text-center mt-10">
        <p className="font-body text-xs">
          Powered by <a href="/" className="text-neo-yellow font-bold hover:underline">ReviewIQ</a>
          {' · '}AI-researched · Expert-reviewed
        </p>
      </footer>
    </div>
  );
}
