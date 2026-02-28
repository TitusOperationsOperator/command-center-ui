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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DollarSign, TrendingUp, ArrowDownRight, Cpu, RefreshCw, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface UsageRow {
  id: string;
  ts: string;
  agent: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  session_key: string | null;
  channel: string | null;
}

const MODEL_COLORS: Record<string, string> = {
  'claude-opus-4-6': '#3b82f6',
  'claude-sonnet-4-5': '#60a5fa',
  'claude-sonnet-4': '#93c5fd',
  'gpt-4.1': '#fbbf24',
  'gpt-4.1-mini': '#a855f7',
  'gpt-4.1-nano': '#c084fc',
  'gemini-3.1-pro': '#00ff41',
  'gemini-3.1-pro-preview': '#34d399',
};

const AGENT_COLORS: Record<string, string> = {
  titus: '#3b82f6',
  looty: '#ffd700',
  minibolt: '#00ff41',
};

type TimeFilter = 'today' | '7d' | '30d' | 'all';

function getFilterDate(filter: TimeFilter): string | null {
  const now = new Date();
  if (filter === 'today') {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  if (filter === '7d') return new Date(Date.now() - 7 * 86400000).toISOString();
  if (filter === '30d') return new Date(Date.now() - 30 * 86400000).toISOString();
  return null;
}

function shortModel(model: string) {
  return model.split('/').pop() || model;
}

function formatTokens(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return String(n);
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg border border-white/[0.1] px-4 py-3 shadow-2xl">
      <p className="mb-2 text-xs text-white/50">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
          <span className="text-xs text-white/70">
            {entry.name}: ${Number(entry.value).toFixed(3)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function FinOpsView() {
  const [data, setData] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TimeFilter>('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [historicalCost, setHistoricalCost] = useState(0);

  async function fetchData() {
    const filterDate = getFilterDate(filter);
    let query = supabase
      .from('api_usage')
      .select('*')
      .order('ts', { ascending: true });

    if (filterDate) {
      query = query.gte('ts', filterDate);
    }

    const [usageResult, finopsResult] = await Promise.all([
      query,
      supabase.from('finops_costs').select('cost'),
    ]);
    setData((usageResult.data || []) as UsageRow[]);
    const hist = (finopsResult.data || []).reduce((s: number, r: any) => s + Number(r.cost), 0);
    setHistoricalCost(hist);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [filter]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  function handleRefresh() {
    setRefreshing(true);
    fetchData();
  }

  // Aggregations
  const trackedCost = data.reduce((s, r) => s + Number(r.cost_usd), 0);
  const totalCost = filter === 'all' ? historicalCost + trackedCost : trackedCost;
  const totalIn = data.reduce((s, r) => s + r.input_tokens, 0);
  const totalOut = data.reduce((s, r) => s + r.output_tokens, 0);
  const totalCalls = data.length;
  const costPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;

  // By agent
  const byAgent: Record<string, { cost: number; calls: number; tokensIn: number; tokensOut: number }> = {};
  for (const r of data) {
    if (!byAgent[r.agent]) byAgent[r.agent] = { cost: 0, calls: 0, tokensIn: 0, tokensOut: 0 };
    byAgent[r.agent].cost += Number(r.cost_usd);
    byAgent[r.agent].calls++;
    byAgent[r.agent].tokensIn += r.input_tokens;
    byAgent[r.agent].tokensOut += r.output_tokens;
  }

  // By model
  const byModel: Record<string, { cost: number; calls: number; tokensIn: number; tokensOut: number }> = {};
  for (const r of data) {
    const m = shortModel(r.model);
    if (!byModel[m]) byModel[m] = { cost: 0, calls: 0, tokensIn: 0, tokensOut: 0 };
    byModel[m].cost += Number(r.cost_usd);
    byModel[m].calls++;
    byModel[m].tokensIn += r.input_tokens;
    byModel[m].tokensOut += r.output_tokens;
  }

  // Daily breakdown
  const byDay: Record<string, { cost: number; tokensIn: number; tokensOut: number; calls: number }> = {};
  for (const r of data) {
    const day = r.ts.split('T')[0];
    if (!byDay[day]) byDay[day] = { cost: 0, tokensIn: 0, tokensOut: 0, calls: 0 };
    byDay[day].cost += Number(r.cost_usd);
    byDay[day].tokensIn += r.input_tokens;
    byDay[day].tokensOut += r.output_tokens;
    byDay[day].calls++;
  }

  const dailyChart = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, d]) => ({
      day: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      cost: d.cost,
      calls: d.calls,
    }));

  const agentPieData = Object.entries(byAgent)
    .sort(([, a], [, b]) => b.cost - a.cost)
    .map(([name, d]) => ({ name, value: d.cost }));

  const modelPieData = Object.entries(byModel)
    .sort(([, a], [, b]) => b.cost - a.cost)
    .map(([name, d]) => ({ name, value: d.cost }));

  const summaryCards = [
    {
      label: 'Total Spend',
      value: '$' + totalCost.toFixed(2),
      sub: totalCalls + ' API calls',
      icon: DollarSign,
      color: 'text-red-400/80',
      bg: 'bg-red-400/[0.06]',
    },
    {
      label: 'Tokens Used',
      value: formatTokens(totalIn + totalOut),
      sub: formatTokens(totalIn) + ' in / ' + formatTokens(totalOut) + ' out',
      icon: Cpu,
      color: 'text-neon/80',
      bg: 'bg-neon/[0.06]',
    },
    {
      label: 'Cost / Call',
      value: '$' + costPerCall.toFixed(3),
      sub: 'Average across all models',
      icon: ArrowDownRight,
      color: 'text-gold/80',
      bg: 'bg-gold/[0.06]',
    },
    {
      label: 'Active Models',
      value: String(Object.keys(byModel).length),
      sub: Object.keys(byModel).join(', '),
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white/90">FinOps</h2>
          <p className="text-xs text-white/30">API costs & token usage — live data</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
            {(['today', '7d', '30d', 'all'] as TimeFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={
                  'rounded-md px-3 py-1.5 text-xs transition-all ' +
                  (filter === f
                    ? 'bg-white/[0.08] text-white/80'
                    : 'text-white/30 hover:text-white/50')
                }
              >
                {f === 'today' ? 'Today' : f === '7d' ? '7 Days' : f === '30d' ? '30 Days' : 'All'}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-white/25 hover:text-white/50 transition"
          >
            <RefreshCw className={'h-3.5 w-3.5 ' + (refreshing ? 'animate-spin' : '')} />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-widest text-white/40">{card.label}</span>
                <span className="text-2xl font-semibold text-white/90">{card.value}</span>
                <span className="text-[10px] text-white/30">{card.sub}</span>
              </div>
              <div className={'flex h-10 w-10 items-center justify-center rounded-lg ' + card.bg}>
                <card.icon className={'h-5 w-5 ' + card.color} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <DollarSign className="h-8 w-8 text-white/10" />
          <span className="text-xs text-white/30">No cost data for this period</span>
          <span className="text-[10px] text-white/20">Usage is logged as agents work</span>
        </div>
      ) : (
        <>
          {/* Daily cost chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white/80">Daily Spend</h3>
                <p className="text-[11px] text-white/30">Cost per day</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-neon animate-pulse" />
                <span className="text-[9px] text-neon/50">LIVE</span>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => '$' + v.toFixed(2)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="cost" name="Cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Agent + Model breakdown */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* By Agent */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6"
            >
              <h3 className="mb-4 text-sm font-medium text-white/80">Cost by Agent</h3>
              <div className="flex items-center gap-6">
                <div className="h-[160px] w-[160px]">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={agentPieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} strokeWidth={0}>
                        {agentPieData.map((entry) => (
                          <Cell key={entry.name} fill={AGENT_COLORS[entry.name] || '#888'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 flex-1">
                  {Object.entries(byAgent)
                    .sort(([, a], [, b]) => b.cost - a.cost)
                    .map(([agent, d]) => {
                      const pct = totalCost > 0 ? ((d.cost / totalCost) * 100).toFixed(0) : '0';
                      return (
                        <div key={agent}>
                          <div className="flex justify-between text-xs mb-1">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: AGENT_COLORS[agent] || '#888' }} />
                              <span className="text-white/60 capitalize">{agent}</span>
                            </div>
                            <span className="text-white/40">${d.cost.toFixed(2)} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: pct + '%', backgroundColor: AGENT_COLORS[agent] || '#888', opacity: 0.7 }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </motion.div>

            {/* By Model */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6"
            >
              <h3 className="mb-4 text-sm font-medium text-white/80">Cost by Model</h3>
              <div className="flex items-center gap-6">
                <div className="h-[160px] w-[160px]">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={modelPieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} strokeWidth={0}>
                        {modelPieData.map((entry) => (
                          <Cell key={entry.name} fill={MODEL_COLORS[entry.name] || '#888'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 flex-1">
                  {Object.entries(byModel)
                    .sort(([, a], [, b]) => b.cost - a.cost)
                    .map(([model, d]) => {
                      const pct = totalCost > 0 ? ((d.cost / totalCost) * 100).toFixed(0) : '0';
                      return (
                        <div key={model}>
                          <div className="flex justify-between text-xs mb-1">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: MODEL_COLORS[model] || '#888' }} />
                              <span className="text-white/60">{model}</span>
                            </div>
                            <span className="text-white/40">${d.cost.toFixed(2)} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: pct + '%', backgroundColor: MODEL_COLORS[model] || '#888', opacity: 0.7 }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent calls table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6"
          >
            <h3 className="mb-4 text-sm font-medium text-white/80">Recent API Calls</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-white/30">
                    <th className="pb-2 pr-4">Time</th>
                    <th className="pb-2 pr-4">Agent</th>
                    <th className="pb-2 pr-4">Model</th>
                    <th className="pb-2 pr-4 text-right">Tokens In</th>
                    <th className="pb-2 pr-4 text-right">Tokens Out</th>
                    <th className="pb-2 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data].reverse().slice(0, 20).map((r) => (
                    <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                      <td className="py-2 pr-4 text-white/40">
                        {new Date(r.ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 pr-4">
                        <span className="capitalize" style={{ color: AGENT_COLORS[r.agent] || '#888' }}>{r.agent}</span>
                      </td>
                      <td className="py-2 pr-4 text-white/50">{shortModel(r.model)}</td>
                      <td className="py-2 pr-4 text-right text-white/40">{formatTokens(r.input_tokens)}</td>
                      <td className="py-2 pr-4 text-right text-white/40">{formatTokens(r.output_tokens)}</td>
                      <td className="py-2 text-right text-white/60">${Number(r.cost_usd).toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
