'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Save, Eye, Edit3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MemoryFileViewProps {
  fileId: string;
  filename: string;
}

function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={i} className="font-semibold text-white/80">
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
}

function renderMarkdown(content: string) {
  const lines = content.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('# ')) {
      return (
        <h1 key={i} className="mb-3 mt-6 first:mt-0 text-lg font-semibold text-neon/90">
          {line.slice(2)}
        </h1>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={i} className="mb-2 mt-5 text-sm font-semibold text-gold/80">
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith('### ')) {
      return (
        <h3 key={i} className="mb-2 mt-4 text-sm font-medium text-white/70">
          {line.slice(4)}
        </h3>
      );
    }
    if (line.startsWith('- ')) {
      return (
        <div key={i} className="flex gap-2 py-0.5 pl-2">
          <span className="text-neon/40">-</span>
          <span className="text-white/55 text-sm">{renderInlineFormatting(line.slice(2))}</span>
        </div>
      );
    }
    if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.+)/);
      if (match) {
        return (
          <div key={i} className="flex gap-2 py-0.5 pl-2">
            <span className="text-gold/50 font-mono text-xs">{match[1]}.</span>
            <span className="text-white/55 text-sm">{renderInlineFormatting(match[2])}</span>
          </div>
        );
      }
    }
    if (line.startsWith('|')) {
      return (
        <div key={i} className="font-mono text-xs text-white/40 py-0.5">
          {line}
        </div>
      );
    }
    if (line.trim() === '') {
      return <div key={i} className="h-2" />;
    }
    return (
      <p key={i} className="text-sm text-white/55 py-0.5">
        {renderInlineFormatting(line)}
      </p>
    );
  });
}

export default function MemoryFileView({ fileId, filename }: MemoryFileViewProps) {
  const [content, setContent] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('memory_files')
        .select('content')
        .eq('id', fileId)
        .maybeSingle();

      if (data) {
        setContent(data.content);
        setEditContent(data.content);
      }
      setLoading(false);
    }
    fetch();
  }, [fileId]);

  async function saveFile() {
    setSaving(true);
    await supabase
      .from('memory_files')
      .update({ content: editContent, updated_at: new Date().toISOString() })
      .eq('id', fileId);

    setContent(editContent);
    setSaving(false);
    setEditMode(false);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon/20 border-t-neon" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <FileText className="h-4 w-4 text-neon/60" />
          <span className="font-mono text-sm text-neon/70">{filename}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] transition-colors ${
              editMode
                ? 'border-neon/20 bg-neon/[0.08] text-neon/70'
                : 'border-white/[0.08] bg-white/[0.03] text-white/40 hover:text-white/60'
            }`}
          >
            {editMode ? <Eye className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
            {editMode ? 'Preview' : 'Edit'}
          </button>
          {editMode && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={saveFile}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border border-neon/30 bg-neon/[0.1] px-3 py-1.5 font-mono text-[11px] text-neon/80 transition-colors hover:bg-neon/[0.15] disabled:opacity-50"
            >
              <Save className="h-3 w-3" />
              {saving ? 'Saving...' : 'Save'}
            </motion.button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {editMode ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="h-full w-full resize-none rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 font-mono text-sm text-neon/70 outline-none focus:border-neon/20 placeholder:text-white/20"
                style={{ minHeight: '400px' }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono"
            >
              {renderMarkdown(content)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
