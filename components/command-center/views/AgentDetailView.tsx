'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, DollarSign, Zap, Clock, Cpu, Activity, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const AGENTS: Record<string, any> = {
  titus: {
    name: 'Titus ⚡',
    role: 'Operations Operator',
    model: 'anthropic/claude-opus-4-6',
    fallbacks: ['openai/gpt-4.1', 'openai/gpt-4.1-mini'],
    workspace: 'workspaceanthropic',
    color: '#3b82f6',
    icon: Shield,
    heartbeat: '30m',
    activeHours: '07:00 - 23:00',
    capabilities: ['memory', 'email', 'research', 'web search', 'browser', 'file ops', 'subagents'],
  },
  looty: {
    name: 'Looty 🪙',
    role: 'Revenue Agent',
    model: 'google/gemini-3.1-pro',
    fallbacks: ['openai/gpt-4.1-mini'],
    workspace: 'workspace-looty',
    color: '#ffd700',
    icon: DollarSign,
    heartbeat: '45m',
    activeHours: '07:00 - 23:00',
    capabilities: ['research', 'revenue analysis', 'content', 'market analysis'],
  },
  bolt: {
    name: 'Mini Bolt 🔨',
    role: 'Builder',
    model: 'anthropic/claude-opus-4-6',
    fallbacks: ['anthropic/claude-sonnet-4-5', 'openai/gpt-4.1-mini'],
    workspace: 'workspace-minibolt',
    color: '#00ff41',
    icon: Zap,
    heartbeat: 'none',
    activeHours: 'on-demand',
    capabilities: ['code', 'git', 'deploy', 'npm', 'build'],
  },
};

interface Props {
  agentId: string;
}

export default function AgentDetailView({ agentId }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const agent = AGENTS[agentId] || AGENTS.titus;
  const Icon = agent.icon;

  useEffect(() => {
    Promise.all([
      supabase
        .from('agent_log')
        .select('*')
        .ilike('source', '%' + agentId + '%')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('memories')
        .select('id, title, category, importance, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ]).then(([logRes, memRes]) => {
      setLogs(logRes.data || []);
      setMemories(memRes.data || []);
      setLoading(false);
    });
  }, [agentId]);

  function relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neon/30 border-t-neon" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Agent header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2" style={{ borderColor: agent.color + '50', backgroundColor: agent.color + '15' }}>
            <Icon className="h-6 w-6" style={{ color: agent.color }} />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-white/90">{agent.name}</h2>
            <p className="font-mono text-xs text-white/40">{agent.role}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-neon animate-pulse" />
            <span className="font-mono text-xs text-neon/70">Online</span>
          </div>
        </div>
      </motion.div>

      {/* Config grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: 'Model', value: agent.model, icon: Cpu },
          { label: 'Heartbeat', value: agent.heartbeat, icon: Clock },
          { label: 'Active Hours', value: agent.activeHours, icon: Activity },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <item.icon className="h-3.5 w-3.5 text-white/30" />
              <span className="font-mono text-[10px] text-white/40">{item.label}</span>
            </div>
            <span className="font-mono text-xs text-white/80">{item.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Fallbacks */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-4">
        <h3 className="font-mono text-xs font-medium text-white/50 mb-2">Fallback Models</h3>
        <div className="flex gap-2 flex-wrap">
          {agent.fallbacks.map((fb: string) => (
            <span key={fb} className="font-mono text-[10px] text-white/50 border border-white/10 rounded-full px-2.5 py-1">{fb}</span>
          ))}
        </div>
      </motion.div>

      {/* Capabilities */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="glass-card p-4">
        <h3 className="font-mono text-xs font-medium text-white/50 mb-2">Capabilities</h3>
        <div className="flex gap-1.5 flex-wrap">
          {agent.capabilities.map((cap: string) => (
            <span key={cap} className="font-mono text-[10px] border rounded-full px-2.5 py-1" style={{ color: agent.color + '90', borderColor: agent.color + '30', backgroundColor: agent.color + '10' }}>{cap}</span>
          ))}
        </div>
      </motion.div>

      {/* Recent activity */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card p-5">
        <h3 className="font-mono text-sm font-medium text-white/70 mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {logs.length === 0 ? (
            <p className="font-mono text-xs text-white/30">No recent activity logged</p>
          ) : (
            logs.map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: agent.color }} />
                <span className="font-mono text-[11px] text-white/60 flex-1 truncate">{log.action}</span>
                <span className="font-mono text-[9px] text-white/20">{relativeTime(log.created_at)}</span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}