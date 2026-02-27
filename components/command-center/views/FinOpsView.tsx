'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp, ArrowDownRight, Percent, Cpu } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CostEntry {
  model_name: string;
  cost: number;
  revenue: number;
  tokens_in: number;
  tokens_out: number;
  requests: number;
  period: string;
}

const modelColors: Record<string, string> = {
  'Claude Opus': '#3b82f6',
  'Gemini Pro': '#00ff41',
  'GPT-4': '#ffd700',
  'GPT-4.1 Mini': '#a855f7',
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg border border-white/[0.1] px-4 py-3 shadow-2xl">
      <p className="mb-2 font-mono text-xs text-white/50">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
          <span className="font-mono text-xs text-white/70">
            {entry.name}: ' + Number(entry.value).toFixed(2) + '
          </span>
        </div>
      ))}
    </div>
  );
}

function formatTokens(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return String(n);
}

export default function FinOpsView() {
  const [costData, setCostData] = useState<CostEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('finops_costs')
      .select('*')
      .order('recorded_at', { ascending: true })
      .then(({ data }) => {
        setCostData((data || []) as CostEntry[]);
        setLoading(false);
      });
  }, []);

  const totalCost = costData.reduce((sum, d) => sum + Number(d.cost), 0);
  const totalTokensIn = costData.reduce((sum, d) => sum + Number(d.tokens_in || 0), 0);
  const totalTokensOut = costData.reduce((sum, d) => sum + Number(d.tokens_out || 0), 0);
  const totalRequests = costData.reduce((sum, d) => sum + Number(d.requests || 0), 0);
  const costPerRequest = totalRequests > 0 ? (totalCost / totalRequests).toFixed(3) : '0';

  const modelTotals = Object.entries(
    costData.reduce((acc, d) => {
      if (!acc[d.model_name]) acc[d.model_name] = { cost: 0, tokens_in: 0, tokens_out: 0, requests: 0 };
      acc[d.model_name].cost += Number(d.cost);
      acc[d.model_name].tokens_in += Number(d.tokens_in || 0);
      acc[d.model_name].tokens_out += Number(d.tokens_out || 0);
      acc[d.model_name].requests += Number(d.requests || 0);
      return acc;
    }, {} as Record<string, { cost: number; tokens_in: number; tokens_out: number; requests: number }>)
  ).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.cost - a.cost);

  const periods = Array.from(new Set(costData.map((d) => d.period)));

  const costByModelAndPeriod = periods.map((period) => {
    const entry: any = { period };
    costData
      .filter((d) => d.period === period)
      .forEach((d) => { entry[d.model_name] = Number(d.cost); });
    return entry;
  });

  const costByPeriod = periods.map((period) => {
    const periodData = costData.filter((d) => d.period === period);
    return {
      period,
      cost: periodData.reduce((s, d) => s + Number(d.cost), 0),
      requests: periodData.reduce((s, d) => s + Number(d.requests || 0), 0),
    };
  });

  const summaryCards = [
    {
      label: 'Total API Spend',
      value: '$' + totalCost.toFixed(2),
      sub: totalRequests + ' requests',
      icon: DollarSign,
      color: 'text-red-400/80',
      bg: 'bg-red-400/[0.06]',
    },
    {
      label: 'Tokens Processed',
      value: formatTokens(totalTokensIn + totalTokensOut),
      sub: formatTokens(totalTokensIn) + ' in / ' + formatTokens(totalTokensOut) + ' out',
      icon: Cpu,
      color: 'text-neon/80',
      bg: 'bg-neon/[0.06]',
    },
    {
      label: 'Cost / Request',
      value: '$' + costPerRequest,
      sub: 'Average across all models',
      icon: ArrowDownRight,
      color: 'text-gold/80',
      bg: 'bg-gold/[0.06]',
    },
    {
      label: 'Active Models',
      value: String(modelTotals.length),
      sub: modelTotals.map(m => m.name).join(', '),
      icon: TrendingUp,
      color: 'text-agent-titus/80',
      bg: 'bg-agent-titus/[0.06]',
    },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon/20 border-t-neon" />
      </div>
    );
  }

  if (costData.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <DollarSign className="h-8 w-8 text-white/10" />
        <span className="font-mono text-xs text-white/30">No cost data recorded yet</span>
        <span className="font-mono text-[10px] text-white/20">Cost tracking will populate as agents work</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                  {card.label}
                </span>
                <span className="font-mono text-2xl font-semibold text-white/90">
                  {card.value}
                </span>
                <span className="font-mono text-[10px] text-white/30">{card.sub}</span>
              </div>
              <div className={'flex h-10 w-10 items-center justify-center rounded-lg ' + card.bg}>
                <card.icon className={'h-5 w-5 ' + card.color} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="mb-6">
            <h3 className="font-mono text-sm font-medium text-white/80">Cost by Model</h3>
            <p className="font-mono text-[11px] text-white/30">Weekly breakdown</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costByModelAndPeriod} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => '$' + v} />
                <Tooltip content={<ChartTooltip />} />
                {Object.entries(modelColors).map(([name, color]) => (
                  <Bar key={name} dataKey={name} fill={color} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
            {Object.entries(modelColors).map(([name, color]) => (
              <div key={name} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-mono text-[10px] text-white/40">{name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="mb-6">
            <h3 className="font-mono text-sm font-medium text-white/80">Weekly Spend Trend</h3>
            <p className="font-mono text-[11px] text-white/30">Total cost over time</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costByPeriod} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => '$' + v} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="cost" name="Total Cost" stroke="#3b82f6" strokeWidth={2} fill="url(#gradCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <h3 className="mb-4 font-mono text-sm font-medium text-white/80">Model Breakdown</h3>
        <div className="space-y-4">
          {modelTotals.map((model) => {
            const pct = totalCost > 0 ? (model.cost / totalCost * 100).toFixed(1) : '0';
            const color = modelColors[model.name] || '#888888';
            return (
              <div key={model.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-mono text-xs text-white/60">{model.name}</span>
                    <span className="font-mono text-[9px] text-white/20">
                      {model.requests} reqs · {formatTokens(model.tokens_in)} in · {formatTokens(model.tokens_out)} out
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-white/40">' + (model.cost.toFixed(2)) + '</span>
                    <span className="font-mono text-[10px] text-white/25 w-12 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: pct + '%' }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color, opacity: 0.7 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
