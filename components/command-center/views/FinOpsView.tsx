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
  Cell,
} from 'recharts';
import { DollarSign, TrendingUp, ArrowDownRight, Percent } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CostEntry {
  model_name: string;
  cost: number;
  revenue: number;
  period: string;
}

const modelColors: Record<string, string> = {
  'Claude Opus': '#3b82f6',
  'Gemini Pro': '#00ff41',
  'GPT-4': '#ffd700',
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
            {entry.name}: ${Number(entry.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function FinOpsView() {
  const [costData, setCostData] = useState<CostEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('finops_costs')
        .select('*')
        .order('recorded_at', { ascending: true });

      if (data) setCostData(data as CostEntry[]);
      setLoading(false);
    }
    fetchData();
  }, []);

  const totalCost = costData.reduce((sum, d) => sum + Number(d.cost), 0);
  const totalRevenue = costData.reduce((sum, d) => sum + Number(d.revenue), 0);
  const netROI = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost * 100).toFixed(1) : '0';
  const costPerTask = (totalCost / 847).toFixed(2);

  const modelTotals = Object.entries(
    costData.reduce((acc, d) => {
      acc[d.model_name] = (acc[d.model_name] || 0) + Number(d.cost);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, cost]) => ({ name, cost }));

  const periods = Array.from(new Set(costData.map((d) => d.period)));
  const roiByPeriod = periods.map((period) => {
    const periodData = costData.filter((d) => d.period === period);
    const pCost = periodData.reduce((s, d) => s + Number(d.cost), 0);
    const pRevenue = periodData.reduce((s, d) => s + Number(d.revenue), 0);
    return {
      period,
      cost: pCost,
      revenue: pRevenue,
      profit: pRevenue - pCost,
    };
  });

  const costByModelAndPeriod = periods.map((period) => {
    const entry: any = { period };
    costData
      .filter((d) => d.period === period)
      .forEach((d) => {
        entry[d.model_name] = Number(d.cost);
      });
    return entry;
  });

  const summaryCards = [
    {
      label: 'Total Spend',
      value: `$${totalCost.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-red-400/80',
      bg: 'bg-red-400/[0.06]',
    },
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-neon/80',
      bg: 'bg-neon/[0.06]',
    },
    {
      label: 'Net ROI',
      value: `${netROI}%`,
      icon: Percent,
      color: 'text-gold/80',
      bg: 'bg-gold/[0.06]',
    },
    {
      label: 'Cost / Task',
      value: `$${costPerTask}`,
      icon: ArrowDownRight,
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card-hover p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                  {card.label}
                </span>
                <span className="font-mono text-2xl font-semibold text-white/90">
                  {card.value}
                </span>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
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
            <h3 className="font-mono text-sm font-medium text-white/80">
              API Costs by Model
            </h3>
            <p className="font-mono text-[11px] text-white/30">Weekly breakdown</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costByModelAndPeriod} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="Claude Opus" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gemini Pro" fill="#00ff41" radius={[4, 4, 0, 0]} />
                <Bar dataKey="GPT-4" fill="#ffd700" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6">
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
            <h3 className="font-mono text-sm font-medium text-white/80">
              Revenue vs Cost & Profit
            </h3>
            <p className="font-mono text-[11px] text-white/30">ROI trend over 4 weeks</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={roiByPeriod} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffd700" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ffd700" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRevFin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00ff41" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#00ff41" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#00ff41"
                  strokeWidth={2}
                  fill="url(#gradRevFin)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Profit"
                  stroke="#ffd700"
                  strokeWidth={2}
                  fill="url(#gradProfit)"
                />
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
        <h3 className="mb-4 font-mono text-sm font-medium text-white/80">
          Cost Allocation by Model
        </h3>
        <div className="space-y-4">
          {modelTotals.map((model) => {
            const pct = totalCost > 0 ? (model.cost / totalCost * 100).toFixed(1) : '0';
            const color = modelColors[model.name] || '#ffffff';
            return (
              <div key={model.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-mono text-xs text-white/60">{model.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-white/40">
                      ${model.cost.toLocaleString()}
                    </span>
                    <span className="font-mono text-[10px] text-white/25 w-12 text-right">
                      {pct}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
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
