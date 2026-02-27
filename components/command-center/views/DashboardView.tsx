'use client';

import { Bot, Gauge, Brain, CheckCircle2, Activity, Database } from 'lucide-react';
import MetricCard from '../MetricCard';
import TokenBurnChart from '../TokenBurnChart';
import { motion } from 'framer-motion';
import { useStats, useAgentLog } from '@/lib/hooks';

export default function DashboardView() {
  const { stats, loading: statsLoading } = useStats();
  const { data: logs, loading: logsLoading } = useAgentLog(10);

  const metrics = [
    {
      label: 'Active Agents',
      value: '3',
      change: 'Titus + Looty + Bolt',
      trend: 'up' as const,
      icon: Bot,
      accent: 'neon' as const,
    },
    {
      label: 'Memories Stored',
      value: statsLoading ? '...' : String(stats.memories),
      change: 'Supabase',
      trend: 'up' as const,
      icon: Brain,
      accent: 'neon' as const,
    },
    {
      label: 'Agent Actions',
      value: statsLoading ? '...' : String(stats.logs),
      change: 'Total logged',
      trend: 'up' as const,
      icon: Activity,
      accent: 'gold' as const,
    },
    {
      label: 'Tasks Tracked',
      value: statsLoading ? '...' : String(stats.tasks),
      change: stats.projects + ' projects',
      trend: 'up' as const,
      icon: CheckCircle2,
      accent: 'neon' as const,
    },
  ];

  function relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }

  function agentColor(source: string) {
    if (!source) return 'text-white/50';
    const s = source.toLowerCase();
    if (s.includes('titus') || s === 'telegram') return 'text-agent-titus';
    if (s.includes('looty')) return 'text-agent-looty';
    if (s.includes('bolt') || s.includes('mini')) return 'text-agent-bolt';
    return 'text-white/50';
  }

  function agentDot(source: string) {
    if (!source) return 'bg-white/30';
    const s = source.toLowerCase();
    if (s.includes('titus') || s === 'telegram') return 'bg-agent-titus';
    if (s.includes('looty')) return 'bg-agent-looty';
    if (s.includes('bolt') || s.includes('mini')) return 'bg-agent-bolt';
    return 'bg-white/30';
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <MetricCard
            key={m.label}
            label={m.label}
            value={m.value}
            change={m.change}
            trend={m.trend}
            icon={m.icon}
            accentColor={m.accent}
            delay={i * 0.1}
          />
        ))}
      </div>

      <TokenBurnChart />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="glass-card p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-neon/60" />
          <h3 className="font-mono text-sm font-medium text-white/80">
            Live Agent Activity
          </h3>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-neon animate-pulse" />
            <span className="font-mono text-[9px] text-neon/50">LIVE</span>
          </div>
        </div>
        <div className="space-y-3">
          {logsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-neon/30 border-t-neon" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center font-mono text-xs text-white/30 py-8">
              No agent activity recorded yet
            </div>
          ) : (
            logs.map((item: any, i: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={"h-1.5 w-1.5 rounded-full flex-shrink-0 " + agentDot(item.source)} />
                  <span className={"font-mono text-xs font-medium flex-shrink-0 " + agentColor(item.source)}>
                    {item.source || 'system'}
                  </span>
                  <span className="font-mono text-xs text-white/50 truncate">
                    {item.action}{item.detail ? ' — ' + (typeof item.detail === 'string' ? item.detail : JSON.stringify(item.detail)).substring(0, 80) : ''}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-white/25 flex-shrink-0 ml-2">
                  {relativeTime(item.created_at)}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
