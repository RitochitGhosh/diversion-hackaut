
'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  queryId?: string | null;
  serviceId?: string | null;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  QUERY_ANSWERED: 'bg-neo-green',
  QUERY_REJECTED: 'bg-neo-orange',
  QUERY_SUBMITTED: 'bg-neo-blue',
  QUERY_PENDING_REVIEW: 'bg-neo-yellow',
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch {
      // network error — silently ignore
    }
  };

  // Initial fetch only — use the bell button to refresh manually
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const markOneRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = async () => {
    setMarking(true);
    await fetch('/api/notifications/read-all', { method: 'POST' });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setMarking(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen((v) => !v); if (!open) fetchNotifications(); }}
        aria-label="Notifications"
        className="relative w-9 h-9 border-3 border-neo-black shadow-brutal-sm flex items-center justify-center hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-neo-orange border-2 border-neo-black rounded-full flex items-center justify-center font-mono font-black text-[10px] px-0.5 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 border-3 border-neo-black shadow-brutal bg-white z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b-3 border-neo-black bg-neo-cream">
            <h3 className="font-display font-black text-sm uppercase tracking-wide">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 bg-neo-orange border-2 border-neo-black font-mono text-[10px] px-1.5 py-0.5">
                  {unreadCount} new
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={marking}
                  className="flex items-center gap-1 text-xs font-display font-bold border-2 border-neo-black px-2 py-1 hover:bg-neo-yellow transition-colors disabled:opacity-50"
                >
                  <CheckCheck size={11} />
                  Clear all
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="hover:opacity-60 transition-opacity"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-neo-black/10">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={28} className="mx-auto mb-2 text-neo-black/20" />
                <p className="font-display font-bold text-sm text-neo-black/40">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-2 p-3 transition-colors ${
                    !n.read ? 'bg-neo-yellow/15' : 'hover:bg-neo-cream/60'
                  }`}
                >
                  {/* Type dot */}
                  <span
                    className={`mt-1 shrink-0 w-2.5 h-2.5 rounded-full border border-neo-black ${
                      TYPE_COLORS[n.type] ?? 'bg-neo-black/20'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-xs leading-tight">{n.title}</p>
                    <p className="text-xs text-neo-black/60 font-body mt-0.5 leading-snug">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-neo-black/30 font-mono mt-1">
                      {formatDate(new Date(n.createdAt))}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markOneRead(n.id)}
                      title="Mark as read"
                      className="shrink-0 w-6 h-6 mt-0.5 border-2 border-neo-black flex items-center justify-center hover:bg-neo-yellow transition-colors"
                    >
                      <Check size={11} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
