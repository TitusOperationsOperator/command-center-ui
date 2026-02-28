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

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg border border-white/[0.1] px-4 py-3 shadow-2xl">
      <p className="mb-2 font-mono text-xs text-white/50">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="font-mono text-xs text-white/70">
            {entry.name}: ${Number(entry.value).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TokenBurnChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('finops_costs')
      .select('period, cost, tokens_in, tokens_out')
      .order('recorded_at', { ascending: true })
      .then(({ data: costs }) => {
        if (costs && costs.length > 0) {
          // Group by period
          const grouped: Record<string, { cost: number; tokens: number }> = {};
          for (const c of costs) {
            if (!grouped[c.period]) grouped[c.period] = { cost: 0, tokens: 0 };
            grouped[c.period].cost += Number(c.cost);
            grouped[c.period].tokens += Number(c.tokens_in || 0) + Number(c.tokens_out || 0);
          }
          const chartData = Object.entries(grouped).map(([period, d]) => ({
            day: period,
            cost: Math.round(d.cost * 100) / 100,
            tokens: Math.round(d.tokens / 1000), // in K
          }));
          setData(chartData);
        }
        setLoading(false);
      });
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
          <h3 className="font-mono text-sm font-medium text-white/80">Daily API Spend</h3>
          <p className="font-mono text-[11px] text-white/30">Cost per day (all models)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gold" />
            <span className="font-mono text-[10px] text-white/40">Cost ($)</span>
          </div>
        </div>
      </div>

      <div className="h-[280px] sm:h-[320px]">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon/20 border-t-neon" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-xs text-white/30">No cost data yet</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientBurn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffd700" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ffd700" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => '$' + v} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cost" name="Cost" stroke="#ffd700" strokeWidth={2} fill="url(#gradientBurn)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}