'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, AlertTriangle, Info, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'agent';
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    // Pull recent agent_log entries as notifications
    const { data } = await supabase
      .from('agent_log')
      .select('*')
      .order('event_time', { ascending: false })
      .limit(20);

    if (data) {
      const mapped: Notification[] = data.map(log => ({
        id: log.id,
        type: (log.action === 'error' ? 'warning' : log.source === 'system' ? 'info' : 'agent') as Notification['type'],
        title: (log.source || 'system') + ': ' + (log.action || 'event'),
        message: typeof log.detail === 'string' ? log.detail : JSON.stringify(log.detail || ''),
        time: new Date(log.event_time),
        read: false,
      }));
      setNotifications(mapped);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30000);
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel('notif-bell')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_log' }, (payload) => {
        const log = payload.new as any;
        setNotifications(prev => [{
          id: log.id,
          type: (log.action === 'error' ? 'warning' : 'agent') as Notification['type'],
          title: (log.source || 'system') + ': ' + (log.action || 'event'),
          message: typeof log.detail === 'string' ? log.detail : JSON.stringify(log.detail || ''),
          time: new Date(log.event_time),
          read: false,
        }, ...prev].slice(0, 30));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const relTime = (d: Date) => {
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  };

  const typeIcon = {
    info: <Info className="h-3.5 w-3.5 text-blue-400" />,
    warning: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
    success: <Check className="h-3.5 w-3.5 text-emerald-400" />,
    agent: <Zap className="h-3.5 w-3.5 text-neon" />,
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) markAllRead(); }}
        className="relative p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
      >
        <Bell className="h-4 w-4 text-white/40" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-red-500 flex items-center justify-center"
          >
            <span className="font-mono text-[8px] text-white font-bold px-1">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[998]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 z-[999] w-80 max-h-96 rounded-xl border border-white/[0.08] bg-[#12122a]/95 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                <span className="font-mono text-xs font-medium text-white/60">Notifications</span>
                <button
                  onClick={markAllRead}
                  className="font-mono text-[9px] text-neon/50 hover:text-neon transition-colors"
                >
                  Mark all read
                </button>
              </div>

              {/* List */}
              <div className="overflow-y-auto max-h-[320px]">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center font-mono text-[10px] text-white/20">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={'flex items-start gap-2.5 px-4 py-2.5 border-b border-white/[0.03] transition-colors ' + (n.read ? '' : 'bg-white/[0.02]')}
                    >
                      <div className="mt-0.5 flex-shrink-0">{typeIcon[n.type]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] font-medium text-white/50 truncate">{n.title}</span>
                          <span className="font-mono text-[8px] text-white/20 flex-shrink-0">{relTime(n.time)}</span>
                        </div>
                        <p className="font-mono text-[10px] text-white/30 truncate mt-0.5">{n.message}</p>
                      </div>
                      {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-neon flex-shrink-0 mt-1" />}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}