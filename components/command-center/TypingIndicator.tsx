'use client';

import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  agentName: string;
  color: string;
}

export default function TypingIndicator({ agentName, color }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-2 px-3 py-2"
    >
      <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2">
        <span className="text-[10px]" style={{ color: color + '80' }}>{agentName}</span>
        <span className="text-[10px] text-white/30">is thinking</span>
        <div className="flex gap-0.5 ml-1">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
            className="h-1 w-1 rounded-full"
            style={{ backgroundColor: color }}
          />
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
            className="h-1 w-1 rounded-full"
            style={{ backgroundColor: color }}
          />
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
            className="h-1 w-1 rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>
    </motion.div>
  );
}