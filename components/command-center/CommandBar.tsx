'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Settings, Command } from 'lucide-react';

export default function CommandBar() {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex h-11 items-center gap-2 border-b border-white/[0.06] bg-space-card/80 px-3 backdrop-blur-xl">
      <div className="flex flex-1 items-center justify-center">
        <div
          className={`relative flex w-full max-w-xl items-center gap-2 rounded-lg border px-3 py-1.5 transition-all duration-200 ${
            focused
              ? 'border-neon/25 bg-white/[0.04]'
              : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03]'
          }`}
        >
          <Search className="h-3 w-3 flex-shrink-0 text-white/25" />
          <input
            type="text"
            placeholder="Run a command or search..."
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="flex-1 bg-transparent font-mono text-xs text-white/70 placeholder:text-white/20 outline-none"
          />
          <div className="hidden sm:flex items-center gap-1 rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5">
            <Command className="h-2.5 w-2.5 text-white/20" />
            <span className="font-mono text-[9px] text-white/20">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="relative flex h-7 w-7 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/60">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-gold/90 px-1 font-mono text-[8px] font-bold text-space">
            3
          </span>
        </button>
        <button className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/60">
          <Settings className="h-3.5 w-3.5" />
        </button>
        <div className="ml-1 flex items-center gap-1.5 rounded-md border border-neon/15 bg-neon/[0.04] px-2 py-1">
          <div className="relative">
            <div className="h-1.5 w-1.5 rounded-full bg-neon" />
            <div className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-neon/40 animate-ping" />
          </div>
          <span className="font-mono text-[9px] text-neon/70 hidden sm:inline">Online</span>
        </div>
      </div>
    </div>
  );
}
