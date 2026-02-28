'use client';

import { motion } from 'framer-motion';
import { Activity, Search } from 'lucide-react';
import { useAgentLog } from '@/lib/hooks';
import { useContextMenu } from '../ContextMenuProvider';
import { useState } from 'react';

export default function ActivityView() {
  const { data: logs, loading } = useAgentLog(100);
  const { show } = useContextMenu();
  const [filter, setFilter] = useState('');

  const filtered = filter
    ? logs.filter((l: any) => {
        const s = filter.toLowerCase();
        return (
          (l.action || '').toLowerCase().includes(s) ||
          (l.source || '').toLowerCase().includes(s) ||
          JSON.stringify(l.detail || '').toLowerCase().includes(s)
        );
      })
    : logs;

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-neon/60" />
        <h2 className="text-lg font-medium text-white/80">Activity Log</h2>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-neon animate-pulse" />
          <span className="text-[9px] text-neon/50">REAL-TIME</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter activity..."
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-4 py-2 text-xs text-white/80 placeholder:text-white/20 outline-none focus:border-neon/30"
        />
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-neon/30 border-t-neon" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-xs text-white/30 py-16">
            {filter ? 'No matching activity' : 'No agent activity recorded yet'}
          </div>
        ) : (
          filtered.map((item: any, i: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="glass-card p-3"
              onContextMenu={(e) => {
                e.preventDefault();
                show(e.clientX, e.clientY, [
                  { label: 'Copy Action', icon: '📋', action: () => navigator.clipboard.writeText(item.action || '') },
                  { label: 'Copy Detail', icon: '📝', action: () => navigator.clipboard.writeText(typeof item.detail === 'string' ? item.detail : JSON.stringify(item.detail)) },
                  { label: 'Copy Source', icon: '🔗', action: () => navigator.clipboard.writeText(item.source || '') },
                  { divider: true, label: '', action: () => {} },
                  { label: 'Filter by: ' + (item.source || 'system'), icon: '🔍', action: () => setFilter(item.source || '') },
                ]);
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 pt-1">
                  <div className={"h-2 w-2 rounded-full " + (
                    (item.source || '').toLowerCase().includes('titus') || item.source === 'telegram' ? 'bg-agent-titus' :
                    (item.source || '').toLowerCase().includes('looty') ? 'bg-agent-looty' :
                    (item.source || '').toLowerCase().includes('bolt') ? 'bg-agent-bolt' :
                    'bg-white/30'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-white/70">
                      {item.source || 'system'}
                    </span>
                    <span className="text-[10px] text-neon/50">{item.action}</span>
                    <span className="text-[9px] text-white/20 ml-auto flex-shrink-0">
                      {relativeTime(item.created_at)}
                    </span>
                  </div>
                  {item.detail && (
                    <p className="text-[10px] text-white/40 mt-1 break-words">
                      {typeof item.detail === 'string' ? item.detail : JSON.stringify(item.detail, null, 2)}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
