'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/lib/supabase';

interface ChartDataPoint {
  day: string;
  tokenBurn: number;
  revenue: number;
}

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass-card rounded-lg border border-white/[0.1] px-4 py-3 shadow-2xl">
      <p className="mb-2 font-mono text-xs text-white/50">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-mono text-xs text-white/70">
            {entry.name}: ${entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TokenBurnChart() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: metrics } = await supabase
        .from('metrics')
        .select('*')
        .order('recorded_at', { ascending: true });

      if (metrics && metrics.length > 0) {
        const burnEntries = metrics.filter((m: any) => m.metric_name === 'token_burn');
        const revenueEntries = metrics.filter((m: any) => m.metric_name === 'revenue');
        const chartData = burnEntries.map((b: any, i: number) => ({
          day: dayLabels[i % 7],
          tokenBurn: Number(b.metric_value),
          revenue: revenueEntries[i] ? Number(revenueEntries[i].metric_value) : 0,
        }));
        setData(chartData);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="glass-card p-6"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-mono text-sm font-medium text-white/80">
            Token Burn vs Revenue
          </h3>
          <p className="font-mono text-[11px] text-white/30">Last 7 days</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gold" />
            <span className="font-mono text-[10px] text-white/40">Token Burn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-neon" />
            <span className="font-mono text-[10px] text-white/40">Revenue</span>
          </div>
        </div>
      </div>

      <div className="h-[280px] sm:h-[320px]">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon/20 border-t-neon" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientBurn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffd700" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ffd700" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff41" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00ff41" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
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
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="tokenBurn"
                name="Token Burn"
                stroke="#ffd700"
                strokeWidth={2}
                fill="url(#gradientBurn)"
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#00ff41"
                strokeWidth={2}
                fill="url(#gradientRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
