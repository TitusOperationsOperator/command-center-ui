'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const { data } = await supabase
      .from('agent_log')
      .select('*')
      .order('event_time', { ascending: false })
      .limit(200);
    setLogs(data || []);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel('logs-view')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_log' }, (payload) => {
        setLogs((prev) => [payload.new, ...prev].slice(0, 200));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <div className="flex items-center gap-2">
        <Terminal className="h-5 w-5 text-neon/60" />
        <h2 className="font-mono text-lg font-medium text-white/80">Logs</h2>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-neon animate-pulse" />
          <span className="font-mono text-[9px] text-neon/50">LIVE</span>
        </div>
        <button onClick={refresh} disabled={loading} className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 font-mono text-[10px] text-white/40 hover:text-white/60 transition-all">
          <RefreshCw className={'h-3 w-3 ' + (loading ? 'animate-spin' : '')} /> Refresh
        </button>
      </div>

      <div className="glass-card p-0 overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin font-mono text-[11px]">
          {logs.map((log: any, i: number) => {
            const time = log.event_time || log.created_at;
            const source = log.channel || 'system';
            const detail = typeof log.detail === 'object' ? (log.detail?.msg || JSON.stringify(log.detail)) : (log.detail || '');
            return (
              <div key={log.id} className={'flex items-start gap-2 px-3 py-1.5 border-b border-white/[0.03] ' + (i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]')}>
                <span className="text-white/20 w-[140px] flex-shrink-0">{time ? new Date(time).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : ''}</span>
                <span className={'w-[80px] flex-shrink-0 ' + (source === 'titus' ? 'text-agent-titus/70' : source === 'looty' ? 'text-agent-looty/70' : source === 'minibolt' ? 'text-agent-bolt/70' : 'text-white/40')}>{source}</span>
                <span className="text-gold/60 w-[140px] flex-shrink-0">{log.action}</span>
                <span className="text-white/40 flex-1 truncate">{detail}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}