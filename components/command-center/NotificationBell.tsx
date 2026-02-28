'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, AlertTriangle, Info, Zap, Shield, Coins } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FeedItem {
  id: string;
  agent: string;
  type: string;
  priority: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

const AGENT_COLORS: Record<string, string> = {
  titus: '#3b82f6',
  looty: '#ffd700',
  minibolt: '#22c55e',
};

const TYPE_ICONS: Record<string, { icon: any; color: string }> = {
  info: { icon: Info, color: 'text-blue-400' },
  warning: { icon: AlertTriangle, color: 'text-amber-400' },
  success: { icon: Check, color: 'text-emerald-400' },
  error: { icon: AlertTriangle, color: 'text-red-400' },
  agent: { icon: Zap, color: 'text-neon' },
};

export default function NotificationBell() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchFeed = useCallback(async () => {
    const { data } = await supabase
      .from('agent_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setItems(data as FeedItem[]);
  }, []);

  useEffect(() => {
    fetchFeed();
    const iv = setInterval(fetchFeed, 15000);
    return () => clearInterval(iv);
  }, [fetchFeed]);

  useEffect(() => {
    const channel = supabase.channel('agent-feed-bell')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_feed' }, (payload) => {
        const item = payload.new as FeedItem;
        setItems(prev => [item, ...prev].slice(0, 30));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler); };
  }, [open]);

  const unreadCount = items.filter(n => !n.read).length;

  const markAllRead = async () => {
    const unreadIds = items.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from('agent_feed').update({ read: true }).in('id', unreadIds);
  };

  const relTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => {
          const willOpen = !open;
          setOpen(willOpen);
          if (willOpen) setTimeout(markAllRead, 200);
        }}
        className="relative p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
      >
        <Bell className="h-4 w-4 text-white/40" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-red-500 flex items-center justify-center"
          >
            <span className="text-[8px] text-white font-bold px-1">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-[9999] w-[340px] max-h-[420px] rounded-xl border border-white/[0.08] bg-[#0a0c14]/98 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-white/30" />
                <span className="text-xs font-medium text-white/60">Agent Feed</span>
                {unreadCount > 0 && (
                  <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </div>
              <button
                onClick={markAllRead}
                className="text-[9px] text-neon/50 hover:text-neon transition-colors"
              >
                Mark all read
              </button>
            </div>

            <div className="overflow-y-auto max-h-[360px] scrollbar-thin">
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="h-5 w-5 text-white/10 mx-auto mb-2" />
                  <p className="text-[10px] text-white/20">No notifications yet</p>
                  <p className="text-[9px] text-white/10 mt-1">Agent updates will appear here</p>
                </div>
              ) : (
                items.map(item => {
                  const typeInfo = TYPE_ICONS[item.type] || TYPE_ICONS.info;
                  const TypeIcon = typeInfo.icon;
                  const agentColor = AGENT_COLORS[item.agent] || '#888';
                  
                  return (
                    <div
                      key={item.id}
                      className={'flex items-start gap-2.5 px-4 py-3 border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] ' + 
                        (item.read ? '' : 'bg-white/[0.02]')}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        <TypeIcon className={'h-3.5 w-3.5 ' + typeInfo.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span 
                            className="text-[9px] font-medium capitalize px-1.5 py-0.5 rounded"
                            style={{ color: agentColor, backgroundColor: agentColor + '15' }}
                          >
                            {item.agent}
                          </span>
                          {item.priority === 'high' && (
                            <span className="text-[8px] text-red-400 bg-red-400/10 px-1 py-0.5 rounded">URGENT</span>
                          )}
                          <span className="text-[8px] text-white/20 ml-auto flex-shrink-0">{relTime(item.created_at)}</span>
                        </div>
                        <p className="text-[11px] text-white/60 leading-relaxed">{item.title}</p>
                        {item.body && (
                          <p className="text-[10px] text-white/30 mt-0.5 line-clamp-2">{item.body}</p>
                        )}
                      </div>
                      {!item.read && <div className="h-1.5 w-1.5 rounded-full bg-neon flex-shrink-0 mt-1.5" />}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}