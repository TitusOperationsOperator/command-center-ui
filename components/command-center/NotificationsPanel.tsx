'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    async function fetch() {
      // Pull recent agent logs + recent API errors as notifications
      const [logsRes, usageRes] = await Promise.all([
        supabase.from('agent_log').select('*').order('event_time', { ascending: false }).limit(10),
        supabase.from('api_usage').select('*').order('ts', { ascending: false }).limit(5),
      ]);

      const items: any[] = [];

      // Agent log items as notifications
      for (const log of (logsRes.data || [])) {
        items.push({
          id: 'log-' + log.id,
          type: 'info',
          title: log.action,
          detail: typeof log.detail === 'object' ? JSON.stringify(log.detail).substring(0, 100) : String(log.detail || ''),
          time: log.event_time,
          source: log.channel || 'system',
        });
      }

      // Recent expensive calls as alerts
      for (const u of (usageRes.data || [])) {
        if (Number(u.cost_usd) > 0.5) {
          items.push({
            id: 'cost-' + u.id,
            type: 'warning',
            title: 'High cost call: $' + Number(u.cost_usd).toFixed(2),
            detail: u.agent + ' / ' + (u.model || '').split('/').pop() + ' — ' + u.input_tokens.toLocaleString() + ' tokens in',
            time: u.ts,
            source: u.agent,
          });
        }
      }

      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(items.slice(0, 15));
      setLoading(false);
    }

    fetch();
  }, [open]);

  function relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute right-12 top-12 z-50 w-[360px] max-h-[480px] glass-card rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-white/40" />
                <span className="text-sm font-medium text-white/70">Notifications</span>
              </div>
              <button onClick={onClose} className="text-white/20 hover:text-white/50 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[400px] scrollbar-thin">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-neon/30 border-t-neon" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-6 w-6 text-white/10 mx-auto mb-2" />
                  <p className="text-xs text-white/20">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                    <div className="flex items-start gap-2.5">
                      {n.type === 'warning' ? (
                        <AlertCircle className="h-4 w-4 text-gold/60 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-neon/40 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/60 truncate">{n.title}</p>
                        {n.detail && <p className="text-[10px] text-white/25 mt-0.5 truncate">{n.detail}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-white/15">{n.source}</span>
                          <span className="text-[9px] text-white/15">·</span>
                          <span className="text-[9px] text-white/15">{relativeTime(n.time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
