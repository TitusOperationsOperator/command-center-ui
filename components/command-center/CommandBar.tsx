'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Command } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CommandBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('memories')
        .select('id, title, category, content')
        .or('title.ilike.%' + query + '%,content.ilike.%' + query + '%')
        .limit(5);
      setResults(data || []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border-b border-white/[0.04] bg-white/[0.01] px-4 py-1.5 transition-colors hover:bg-white/[0.03]"
      >
        <Search className="h-3 w-3 text-white/20" />
        <span className="font-mono text-[11px] text-white/20">Search memories, files, commands...</span>
        <div className="ml-auto flex items-center gap-0.5 rounded border border-white/[0.08] px-1.5 py-0.5">
          <Command className="h-2.5 w-2.5 text-white/20" />
          <span className="font-mono text-[9px] text-white/20">K</span>
        </div>
      </button>
    );
  }

  return (
    <div className="border-b border-white/[0.06] bg-space-card/50 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-4 py-2">
        <Search className="h-3.5 w-3.5 text-neon/50" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
          placeholder="Search memories, files, commands..."
          className="flex-1 bg-transparent font-mono text-xs text-white/80 placeholder:text-white/20 outline-none"
        />
        <button onClick={() => setOpen(false)} className="font-mono text-[9px] text-white/30 border border-white/10 rounded px-1.5 py-0.5 hover:text-white/50">ESC</button>
      </div>
      {results.length > 0 && (
        <div className="border-t border-white/[0.04] max-h-[200px] overflow-y-auto">
          {results.map((r: any) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-2 hover:bg-white/[0.03] cursor-pointer">
              <span className="font-mono text-[10px] text-neon/50 border border-neon/20 rounded px-1.5 py-0.5">{r.category}</span>
              <span className="font-mono text-xs text-white/70">{r.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}