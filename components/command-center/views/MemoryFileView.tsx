'use client';

import { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MemoryFileViewProps {
  fileId?: string;
  filename?: string;
}

export default function MemoryFileView({ fileId, filename }: MemoryFileViewProps) {
  const [memory, setMemory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fileId) return;
    supabase
      .from('memories')
      .select('*')
      .eq('id', fileId)
      .maybeSingle()
      .then(({ data }) => {
        setMemory(data);
        setLoading(false);
      });
  }, [fileId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neon/30 border-t-neon" />
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="font-mono text-xs text-white/30">Memory not found</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-neon/60" />
        <h2 className="font-mono text-lg font-medium text-white/80">{memory.title}</h2>
      </div>

      <div className="flex gap-2 flex-wrap">
        <span className="font-mono text-[10px] text-neon/50 border border-neon/20 rounded-full px-2 py-0.5">
          {memory.category}{memory.subcategory ? '/' + memory.subcategory : ''}
        </span>
        <span className="font-mono text-[10px] text-gold/50 border border-gold/20 rounded-full px-2 py-0.5">
          importance: {memory.importance}
        </span>
        <span className="font-mono text-[10px] text-white/30 border border-white/10 rounded-full px-2 py-0.5">
          {memory.source || 'unknown'}
        </span>
        <span className="font-mono text-[10px] text-white/30">
          {new Date(memory.created_at).toLocaleString()}
        </span>
      </div>

      <div className="glass-card p-5">
        <pre className="font-mono text-xs text-white/70 whitespace-pre-wrap break-words leading-relaxed">
          {memory.content}
        </pre>
      </div>

      {memory.metadata && Object.keys(memory.metadata).length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-mono text-xs font-medium text-white/50 mb-2">Metadata</h3>
          <pre className="font-mono text-[10px] text-white/40 whitespace-pre-wrap">
            {JSON.stringify(memory.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
