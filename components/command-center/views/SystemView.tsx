'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, Database, Wifi, HardDrive, RefreshCw, Shield, Clock } from 'lucide-react';
import { getSystemHealth } from '@/lib/api';
import { useContextMenu } from '../ContextMenuProvider';
import { useToast } from '../Toast';

export default function SystemView() {
  const { show: showCtx } = useContextMenu();
  const { toast } = useToast();
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  async function refresh() {
    setLoading(true);
    const h = await getSystemHealth();
    setHealth(h);
    setLastRefresh(new Date());
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = (status: string) => {
    if (status === 'healthy') return 'text-neon bg-neon/10 border-neon/30';
    if (status === 'degraded') return 'text-gold bg-gold/10 border-gold/30';
    return 'text-red-400 bg-red-400/10 border-red-400/30';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-2">
        <Server className="h-5 w-5 text-neon/60" />
        <h2 className="text-lg font-medium text-white/80">System Health</h2>
        <button
          onClick={refresh}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 text-[10px] text-white/40 hover:text-white/60 hover:border-white/20 transition-all"
        >
          <RefreshCw className={'h-3 w-3 ' + (loading ? 'animate-spin' : '')} />
          Refresh
        </button>
      </div>

      {loading && !health ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-neon/30 border-t-neon" />
        </div>
      ) : health && (
        <>
          {/* Status banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={'glass-card p-4 flex items-center gap-3 border ' + statusColor(health.supabaseStatus)}
          >
            <div className={'h-3 w-3 rounded-full ' + (health.supabaseStatus === 'healthy' ? 'bg-neon animate-pulse' : 'bg-gold')} />
            <span className="text-sm font-medium">
              {health.supabaseStatus === 'healthy' ? 'All Systems Operational' : 'Performance Degraded'}
            </span>
            <span className="text-[10px] text-white/30 ml-auto">
              Last check: {lastRefresh.toLocaleTimeString()}
            </span>
          </motion.div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { label: 'Supabase Ping', value: health.supabasePingMs + 'ms', icon: Wifi, accent: health.supabasePingMs < 500 ? 'neon' : 'gold' },
              { label: 'Memories', value: String(health.memories), icon: Database, accent: 'neon' },
              { label: 'Agent Logs', value: String(health.agentLogs), icon: Shield, accent: 'neon' },
              { label: 'Chat Threads', value: String(health.chatThreads), icon: Clock, accent: 'neon' },
              { label: 'Messages', value: String(health.chatMessages), icon: Clock, accent: 'neon' },
              { label: 'Files Uploaded', value: String(health.fileUploads), icon: HardDrive, accent: 'neon' },
              { label: 'Storage Buckets', value: String(health.storageBuckets), icon: HardDrive, accent: 'neon' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className={'h-3.5 w-3.5 ' + (item.accent === 'neon' ? 'text-neon/50' : 'text-gold/50')} />
                  <span className="text-[10px] text-white/40">{item.label}</span>
                </div>
                <span className={'font-mono text-xl font-bold ' + (item.accent === 'neon' ? 'text-neon/80' : 'text-gold/80')}>
                  {item.value}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Agent info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5"
          >
            <h3 className="text-sm font-medium text-white/70 mb-3">Agent Fleet</h3>
            <div className="space-y-3">
              {[
                { name: 'Titus \u26a1', role: 'Operations Operator', model: 'claude-opus-4-6', color: 'agent-titus' },
                { name: 'Looty \ud83e\ude99', role: 'Revenue Agent', model: 'gemini-3.1-pro', color: 'agent-looty' },
                { name: 'Mini Bolt \ud83d\udd28', role: 'Builder', model: 'gpt-4.1', color: 'agent-bolt' },
              ].map((a) => (
                <div key={a.name} className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                  <div className={'h-2 w-2 rounded-full bg-' + a.color} />
                  <div className="flex-1">
                    <span className={'text-xs font-medium text-' + a.color}>{a.name}</span>
                    <span className="text-[10px] text-white/30 ml-2">{a.role}</span>
                  </div>
                  <span className="text-[9px] text-white/20">{a.model}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
