'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { SlashCommand } from '@/lib/commands';

interface SlashHintsProps {
  commands: SlashCommand[];
  onSelect: (command: string) => void;
  selectedIndex: number;
}

export default function SlashHints({ commands, onSelect, selectedIndex }: SlashHintsProps) {
  if (commands.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="absolute bottom-full left-0 right-0 mb-1 max-h-[240px] overflow-y-auto rounded-lg border border-white/[0.08] bg-space-card/95 backdrop-blur-xl shadow-2xl z-50"
    >
      {commands.map((cmd, i) => (
        <button
          key={cmd.name}
          onClick={() => onSelect(cmd.name + ' ')}
          className={'flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors ' + (i === selectedIndex ? 'bg-neon/10' : 'hover:bg-white/[0.04]')}
        >
          <span className={'font-mono text-xs font-medium ' + (i === selectedIndex ? 'text-neon' : 'text-neon/70')}>{cmd.name}</span>
          <div className="flex-1 min-w-0">
            <span className="font-mono text-[11px] text-white/50">{cmd.description}</span>
            <div className="font-mono text-[9px] text-white/20 mt-0.5">{cmd.usage}</div>
          </div>
        </button>
      ))}
    </motion.div>
  );
}