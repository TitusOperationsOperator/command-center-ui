'use client';

import { Bot, Gauge, DollarSign, CheckCircle2, Activity } from 'lucide-react';
import MetricCard from '../MetricCard';
import TokenBurnChart from '../TokenBurnChart';
import { motion } from 'framer-motion';

const metrics = [
  {
    label: 'Active Agents',
    value: '3',
    change: '+0%',
    trend: 'up' as const,
    icon: Bot,
    accent: 'neon' as const,
  },
  {
    label: 'Gateway Latency',
    value: '42ms',
    change: '-12%',
    trend: 'up' as const,
    icon: Gauge,
    accent: 'neon' as const,
  },
  {
    label: 'API Spend (7d)',
    value: '$5,942',
    change: '+8.3%',
    trend: 'down' as const,
    icon: DollarSign,
    accent: 'gold' as const,
  },
  {
    label: 'Tasks Completed',
    value: '847',
    change: '+23%',
    trend: 'up' as const,
    icon: CheckCircle2,
    accent: 'neon' as const,
  },
];

const recentActivity = [
  { agent: 'Titus', action: 'Traffic pattern normalized', time: '15m ago', color: 'text-agent-titus' },
  { agent: 'Mini Bolt', action: 'Memory consolidation complete', time: '30m ago', color: 'text-agent-bolt' },
  { agent: 'Looty', action: 'GAMEPLAN.md updated', time: '40m ago', color: 'text-agent-looty' },
  { agent: 'Titus', action: 'Elevated traffic detected', time: '50m ago', color: 'text-agent-titus' },
  { agent: 'Mini Bolt', action: 'Memory pipeline initiated', time: '1h ago', color: 'text-agent-bolt' },
];

export default function DashboardView() {
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
            Recent Activity
          </h3>
        </div>
        <div className="space-y-3">
          {recentActivity.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.05 }}
              className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-3">
                <div className={`h-1.5 w-1.5 rounded-full ${
                  item.agent === 'Titus' ? 'bg-agent-titus' :
                  item.agent === 'Looty' ? 'bg-agent-looty' :
                  'bg-agent-bolt'
                }`} />
                <span className={`font-mono text-xs font-medium ${item.color}`}>
                  {item.agent}
                </span>
                <span className="font-mono text-xs text-white/50">
                  {item.action}
                </span>
              </div>
              <span className="font-mono text-[10px] text-white/25">
                {item.time}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
