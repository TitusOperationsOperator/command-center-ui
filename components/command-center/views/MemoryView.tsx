'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Search, Star } from 'lucide-react';
import { useMemories } from '@/lib/hooks';
import { useContextMenu } from '../ContextMenuProvider';
import type { TabItem } from '../types';

interface MemoryViewProps {
  onOpenFile: (tab: Omit<TabItem, 'pinned'>) => void;
}

export default function MemoryView({ onOpenFile }: MemoryViewProps) {
  const { data: memories, loading } = useMemories(100);
  const { show: showCtx } = useContextMenu();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(memories.map((m: any) => m.category))).filter(Boolean);

  const filtered = memories.filter((m: any) => {
    if (selectedCategory && m.category !== selectedCategory) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        (m.title || '').toLowerCase().includes(s) ||
        (m.content || '').toLowerCase().includes(s) ||
        (m.category || '').toLowerCase().includes(s)
      );
    }
    return true;
  });

  function relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-neon/60" />
        <h2 className="font-mono text-lg font-medium text-white/80">Agent Memory</h2>
        <span className="font-mono text-xs text-white/30 ml-2">{memories.length} memories</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memories..."
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-4 py-2 font-mono text-xs text-white/80 placeholder:text-white/20 outline-none focus:border-neon/30"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={"px-2.5 py-1 rounded-full font-mono text-[10px] border transition-all " + (
            !selectedCategory ? 'border-neon/40 text-neon bg-neon/10' : 'border-white/10 text-white/40 hover:border-white/20'
          )}
        >
          All
        </button>
        {categories.map((cat: string) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            className={"px-2.5 py-1 rounded-full font-mono text-[10px] border transition-all " + (
              selectedCategory === cat ? 'border-neon/40 text-neon bg-neon/10' : 'border-white/10 text-white/40 hover:border-white/20'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Memory list */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-neon/30 border-t-neon" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center font-mono text-xs text-white/30 py-16">
            {search ? 'No matching memories' : 'No memories stored yet'}
          </div>
        ) : (
          filtered.map((mem: any, i: number) => (
            <motion.div
              key={mem.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="glass-card p-4 cursor-pointer hover:border-neon/20 transition-all"
              onContextMenu={(e: React.MouseEvent) => {
                e.preventDefault();
                showCtx(e.clientX, e.clientY, [
                  { label: "Copy Title", icon: "📋", action: () => navigator.clipboard.writeText(mem.title || "") },
                  { label: "Copy Content", icon: "📝", action: () => navigator.clipboard.writeText(mem.content || "") },
                  { label: "Filter: " + (mem.category || "none"), icon: "🔍", action: () => setSelectedCategory(mem.category) },
                  { divider: true, label: "", action: () => {} },
                  { label: "Importance: " + (mem.importance || "?"), icon: "⭐", action: () => {}, disabled: true },
                ]);
              }}
                            onClick={() => onOpenFile({
                id: 'mem-' + mem.id,
                label: mem.title || 'Memory',
                icon: Brain,
                type: 'memory-file',
                data: { fileId: mem.id, filename: mem.title },
              })}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  {mem.importance >= 9 && <Star className="h-3 w-3 text-gold fill-gold/30" />}
                  <div className={"h-2 w-2 rounded-full " + (
                    mem.importance >= 9 ? 'bg-gold' :
                    mem.importance >= 7 ? 'bg-neon' :
                    'bg-white/20'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] text-neon/50 border border-neon/20 rounded-full px-2 py-0.5">
                      {mem.category}{mem.subcategory ? '/' + mem.subcategory : ''}
                    </span>
                    <span className="font-mono text-[9px] text-white/20 ml-auto">
                      {relativeTime(mem.created_at)}
                    </span>
                  </div>
                  <h4 className="font-mono text-xs text-white/80 font-medium">{mem.title}</h4>
                  <p className="font-mono text-[10px] text-white/40 mt-1 line-clamp-2">
                    {(mem.content || '').substring(0, 200)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
