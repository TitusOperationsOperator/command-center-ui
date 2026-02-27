'use client';

import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: LucideIcon;
  accentColor?: 'neon' | 'gold';
  delay?: number;
}

export default function MetricCard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  accentColor = 'neon',
  delay = 0,
}: MetricCardProps) {
  const isNeon = accentColor === 'neon';
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ scale: 1.02 }}
      className={`glass-card-hover p-5 ${!isNeon ? 'glass-card-gold' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">
            {label}
          </span>
          <span className="font-mono text-2xl font-semibold text-white/90">
            {value}
          </span>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            isNeon ? 'bg-neon/[0.08]' : 'bg-gold/[0.08]'
          }`}
        >
          <Icon
            className={`h-5 w-5 ${isNeon ? 'text-neon/70' : 'text-gold/70'}`}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <TrendIcon
          className={`h-3.5 w-3.5 ${
            trend === 'up' ? 'text-neon/80' : 'text-red-400/80'
          }`}
        />
        <span
          className={`font-mono text-xs ${
            trend === 'up' ? 'text-neon/70' : 'text-red-400/70'
          }`}
        >
          {change}
        </span>
        <span className="font-mono text-[10px] text-white/25">vs last week</span>
      </div>
    </motion.div>
  );
}
