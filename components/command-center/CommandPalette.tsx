'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, LayoutDashboard, User, Coins, Zap, FolderKanban,
  Activity, Brain, FileText, Clock, ScrollText, Monitor,
  DollarSign, Settings, MessageCircle, Terminal, Send,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export default function CommandPalette({ open, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    { id: 'nav-dash', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, category: 'Navigation', action: () => onNavigate('dashboard'), keywords: ['home', 'overview'] },
    { id: 'nav-titus', label: 'Titus Agent', icon: <Zap className="h-4 w-4" />, category: 'Navigation', action: () => onNavigate('titus'), keywords: ['agent', 'main'] },
    { id: 'nav-looty', label: 'Looty Agent', icon: <Coins className="h-4 w-4" />, category: 'Navigation', action: () => onNavigate('looty'), keywords: ['revenue', 'agent'] },
    { id: 'nav-bolt', label: 'Mini Bolt Agent', icon: <Zap className="h-4 w-4" />, category: 'Navigation', action: () => onNavigate('minibolt'), keywords: ['builder', 'agent'] },
    { id: 'nav-projects', label: 'Projects', icon: <FolderKanban className="h-4 w-4" />, category: 'Navigation', action: () => onNavigate('projects'), keywords: ['tasks', 'kanban'] },
    { id: 'nav-activity', label: 'Activity Feed', icon: <Activity className="h-4 w-4" />, category: 'Navigation', action: () => onNavigate('activity'), keywords: ['timeline', 'events'] },
    { id: 'nav-memory', label: 'Memory Browser', icon: <Brain className="h-4 w-4" />, category: 'Navigation', action: () => onNavigate('memory'), keywords: ['memories', 'recall'] },
    { id: 'nav-files', label: 'Files', icon: <FileText className="h-4 w-4" />, category: 'Navigation', action: () => onNavigate('files'), keywords: ['uploads', 'documents'] },
    { id: 'nav-cron', label: 'Cron Jobs', icon: <Clock className="h-4 w-4" />, category: 'Navigation', action: () => onNavigate('cron'), keywords: ['schedule', 'heartbeat', 'timer'] },
    { id: 'nav-logs', label: 'Logs', icon: <ScrollText className="h-4 w-4" />, category: 'Navigation', action: () => onNavigate('logs'), keywords: ['agent_log', 'debug'] },
    { id: 'nav-system', label: 'System Health', icon: <Monitor className="h-4 w-4" />, category: 'Navigation', action: () => onNavigate('system'), keywords: ['health', 'status'] },
    { id: 'nav-finops', label: 'FinOps', icon: <DollarSign className="h-4 w-4" />, category: 'Navigation', action: () => onNavigate('finops'), keywords: ['cost', 'spending', 'budget', 'tokens'] },
    { id: 'nav-settings', label: 'Settings', icon: <Settings className="h-4 w-4" />, category: 'Navigation', action: () => onNavigate('settings'), keywords: ['config', 'preferences'] },
    // Actions
    { id: 'act-chat', label: 'Open Chat', icon: <MessageCircle className="h-4 w-4" />, category: 'Actions', action: () => { onNavigate('dashboard'); }, keywords: ['message', 'talk'] },
    { id: 'act-status', label: 'Send /status', icon: <Send className="h-4 w-4" />, category: 'Actions', action: () => onNavigate('dashboard'), keywords: ['health', 'check'] },
    { id: 'act-cost', label: 'Send /cost', icon: <DollarSign className="h-4 w-4" />, category: 'Actions', action: () => onNavigate('finops'), keywords: ['spend'] },
  ], [onNavigate]);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.keywords || []).some(k => k.includes(q))
    );
  }, [query, commands]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const run = (cmd: CommandItem) => { cmd.action(); onClose(); };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && filtered[selectedIndex]) { run(filtered[selectedIndex]); }
    if (e.key === 'Escape') { onClose(); }
  };

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach(cmd => {
      if (!map.has(cmd.category)) map.set(cmd.category, []);
      map.get(cmd.category)!.push(cmd);
    });
    return map;
  }, [filtered]);

  let flatIndex = 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
            className="fixed left-1/2 top-[20%] z-[9991] w-[90%] max-w-lg -translate-x-1/2 rounded-xl border border-white/[0.08] bg-[#12122a]/95 backdrop-blur-2xl shadow-[0_16px_64px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
              <Search className="h-4 w-4 text-white/30 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent font-mono text-sm text-white/80 placeholder:text-white/20 outline-none"
              />
              <kbd className="hidden sm:inline font-mono text-[9px] text-white/20 bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/[0.06]">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[320px] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center font-mono text-xs text-white/20">No results</div>
              ) : (
                Array.from(grouped.entries()).map(([category, items]) => {
                  const section = (
                    <div key={category}>
                      <div className="px-4 py-1.5 font-mono text-[9px] font-medium text-white/20 uppercase tracking-wider">{category}</div>
                      {items.map(cmd => {
                        const idx = flatIndex++;
                        return (
                          <button
                            key={cmd.id}
                            onClick={() => run(cmd)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={[
                              'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                              idx === selectedIndex ? 'bg-neon/[0.08] text-neon' : 'text-white/50 hover:bg-white/[0.03]',
                            ].join(' ')}
                          >
                            <span className={idx === selectedIndex ? 'text-neon' : 'text-white/30'}>{cmd.icon}</span>
                            <span className="font-mono text-[11px] flex-1">{cmd.label}</span>
                            {idx === selectedIndex && <span className="font-mono text-[9px] text-neon/50">Enter ↵</span>}
                          </button>
                        );
                      })}
                    </div>
                  );
                  return section;
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.04] px-4 py-2 flex items-center justify-between">
              <span className="font-mono text-[9px] text-white/15">⌘K to toggle</span>
              <div className="flex gap-2">
                <kbd className="font-mono text-[9px] text-white/15 bg-white/[0.03] px-1 py-0.5 rounded">↑↓</kbd>
                <span className="font-mono text-[9px] text-white/10">navigate</span>
                <kbd className="font-mono text-[9px] text-white/15 bg-white/[0.03] px-1 py-0.5 rounded">↵</kbd>
                <span className="font-mono text-[9px] text-white/10">select</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}