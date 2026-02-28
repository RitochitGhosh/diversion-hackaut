'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  History,
  MessageSquare,
  Bot,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ConversationEntry {
  queryId: string | null;
  service: {
    id: string;
    name: string;
    serviceCode: string;
    logoEmoji: string;
  };
  question: {
    id: string;
    content: string;
    createdAt: string;
  };
  answer: {
    id: string;
    content: string;
    createdAt: string;
  } | null;
}

interface Membership {
  service: { id: string; name: string; logoEmoji: string };
}

function ConversationCard({ conv }: { conv: ConversationEntry }) {
  const [expanded, setExpanded] = useState(false);
  const isAnswered = conv.answer !== null;

  return (
    <div
      className={`border-3 border-neo-black bg-white transition-shadow ${
        expanded ? 'shadow-brutal' : 'shadow-brutal-sm hover:shadow-brutal'
      }`}
    >
      {/* Card header — always visible, click to expand */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 flex items-start gap-3 group"
      >
        {/* Status dot */}
        <div className="mt-0.5 shrink-0">
          {isAnswered ? (
            <CheckCircle2 size={18} className="text-neo-green" />
          ) : (
            <Clock size={18} className="text-neo-black/30 animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Service + date row */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-display font-bold text-xs bg-neo-cream border-2 border-neo-black px-2 py-0.5">
              {conv.service.logoEmoji} {conv.service.name}
            </span>
            {isAnswered ? (
              <span className="font-display font-bold text-[10px] bg-neo-green border-2 border-neo-black px-2 py-0.5 uppercase tracking-wide">
                Answered
              </span>
            ) : (
              <span className="font-display font-bold text-[10px] bg-neo-yellow border-2 border-neo-black px-2 py-0.5 uppercase tracking-wide">
                Pending review
              </span>
            )}
            <span className="ml-auto font-mono text-xs text-neo-black/40 shrink-0">
              {formatDate(new Date(conv.question.createdAt))}
            </span>
          </div>

          {/* Question preview */}
          <p className="font-body text-sm text-neo-black leading-snug line-clamp-2">
            {conv.question.content}
          </p>

          {/* Answer snippet when collapsed */}
          {!expanded && isAnswered && (
            <p className="font-body text-xs text-neo-black/50 mt-1.5 line-clamp-1">
              {conv.answer!.content.slice(0, 120)}…
            </p>
          )}
        </div>

        {/* Chevron */}
        <div className="shrink-0 mt-0.5 text-neo-black/40 group-hover:text-neo-black transition-colors">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded body — full conversation thread */}
      {expanded && (
        <div className="border-t-3 border-neo-black p-4 space-y-4 bg-neo-cream/40">
          {/* USER bubble */}
          <div className="flex justify-end">
            <div className="max-w-[85%] space-y-1">
              <div className="flex items-center gap-1.5 justify-end">
                <MessageSquare size={11} className="text-neo-black/40" />
                <span className="font-display font-bold text-[11px] text-neo-black/40 uppercase tracking-wide">
                  You
                </span>
              </div>
              <div className="bg-neo-black text-white border-3 border-neo-black px-4 py-2.5 font-body text-sm leading-relaxed whitespace-pre-wrap">
                {conv.question.content}
              </div>
            </div>
          </div>

          {/* ASSISTANT bubble */}
          {isAnswered ? (
            <div className="flex justify-start">
              <div className="max-w-[85%] space-y-1">
                <div className="flex items-center gap-1.5">
                  <Bot size={11} className="text-neo-black/40" />
                  <span className="font-display font-bold text-[11px] text-neo-black/40 uppercase tracking-wide">
                    ReviewIQ
                  </span>
                  <span className="font-mono text-[10px] text-neo-black/30">
                    · {formatDate(new Date(conv.answer!.createdAt))}
                  </span>
                </div>
                <div className="border-3 border-neo-black bg-white px-4 py-3 font-body text-sm leading-relaxed whitespace-pre-wrap">
                  {conv.answer!.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 border-3 border-neo-black/20 bg-neo-yellow/30 px-4 py-2.5 text-xs font-display font-bold text-neo-black/50">
                <Loader2 size={12} className="animate-spin" />
                Awaiting expert review…
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const searchParams = useSearchParams();

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeServiceId, setActiveServiceId] = useState<string>('');
  const [conversations, setConversations] = useState<ConversationEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    async function loadServices() {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (res.ok && data.memberships?.length > 0) {
        setMemberships(data.memberships);
        const paramId = searchParams.get('serviceId');
        setActiveServiceId(paramId ?? '');
      }
    }
    loadServices();
  }, [searchParams]);

  const loadConversations = useCallback(
    async (replace = true, cursor?: string) => {
      replace ? setLoading(true) : setLoadingMore(true);
      try {
        const params = new URLSearchParams({ limit: '20' });
        if (activeServiceId) params.set('serviceId', activeServiceId);
        if (cursor) params.set('cursor', cursor);
        const res = await fetch(`/api/messages?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (replace) {
          setConversations(data.conversations ?? []);
        } else {
          setConversations((prev) => [...prev, ...(data.conversations ?? [])]);
        }
        setNextCursor(data.nextCursor ?? null);
      } finally {
        replace ? setLoading(false) : setLoadingMore(false);
      }
    },
    [activeServiceId]
  );

  useEffect(() => {
    loadConversations(true);
  }, [loadConversations]);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div className="border-3 border-neo-black shadow-brutal bg-neo-yellow p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-black text-2xl mb-1 flex items-center gap-2">
              <History size={22} /> Conversation History
            </h1>
            <p className="font-body text-sm text-neo-black/60">
              Click any conversation to see the full question and answer.
            </p>
          </div>
          <Button variant="black" size="sm" onClick={() => loadConversations(true)} className="gap-1 shrink-0">
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* Service filter tabs */}
      {memberships.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveServiceId('')}
            className={`flex items-center gap-2 px-4 py-2 border-3 border-neo-black font-display font-bold text-sm whitespace-nowrap transition-all ${
              activeServiceId === '' ? 'bg-neo-black text-white' : 'bg-white hover:bg-neo-cream'
            }`}
          >
            All Services
          </button>
          {memberships.map(({ service }) => (
            <button
              key={service.id}
              onClick={() => setActiveServiceId(service.id)}
              className={`flex items-center gap-2 px-4 py-2 border-3 border-neo-black font-display font-bold text-sm whitespace-nowrap transition-all ${
                activeServiceId === service.id ? 'bg-neo-black text-white' : 'bg-white hover:bg-neo-cream'
              }`}
            >
              {service.logoEmoji} {service.name}
            </button>
          ))}
        </div>
      )}

      {/* Conversation list */}
      {loading ? (
        <div className="border-3 border-neo-black p-12 text-center bg-white">
          <div className="w-10 h-10 border-3 border-neo-black border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="border-3 border-neo-black p-12 text-center bg-neo-cream">
          <History size={44} className="mx-auto mb-3 opacity-20" />
          <h3 className="font-display font-black text-lg mb-1">No conversations yet</h3>
          <p className="font-body text-sm text-neo-black/50">
            Questions you ask will appear here as conversation cards.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-display font-bold text-sm text-neo-black/50">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            {nextCursor ? ' · scroll for more' : ''}
          </p>

          {conversations.map((conv) => (
            <ConversationCard key={conv.queryId ?? conv.question.id} conv={conv} />
          ))}

          {nextCursor && (
            <div className="text-center pt-2">
              <Button
                variant="white"
                onClick={() => loadConversations(false, nextCursor)}
                loading={loadingMore}
                className="gap-2"
              >
                Load older conversations
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
