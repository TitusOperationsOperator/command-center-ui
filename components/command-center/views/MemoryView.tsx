'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { TabItem } from '../types';

interface MemoryFile {
  id: string;
  filename: string;
  content: string;
  updated_at: string;
}

interface MemoryViewProps {
  onOpenFile: (tab: Omit<TabItem, 'pinned'>) => void;
}

export default function MemoryView({ onOpenFile }: MemoryViewProps) {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFiles() {
      const { data } = await supabase
        .from('memory_files')
        .select('*')
        .order('updated_at', { ascending: false });

      if (data) setFiles(data);
      setLoading(false);
    }
    fetchFiles();
  }, []);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function handleOpenFile(file: MemoryFile) {
    onOpenFile({
      id: `memory-file-${file.id}`,
      label: file.filename,
      icon: FileText,
      type: 'memory-file',
      data: { fileId: file.id, filename: file.filename },
    });
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon/20 border-t-neon" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-neon/60" />
        <h2 className="font-mono text-sm font-medium text-white/80">Memory Bank</h2>
        <span className="font-mono text-[10px] text-white/25">{files.length} files</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {files.map((file, i) => (
          <motion.button
            key={file.id}
            onClick={() => handleOpenFile(file)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group glass-card-hover p-5 text-left"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-neon/50" />
                <span className="font-mono text-xs font-medium text-white/80 truncate">
                  {file.filename}
                </span>
              </div>
              <ExternalLink className="h-3 w-3 text-white/15 transition-colors group-hover:text-neon/50" />
            </div>
            <p className="font-mono text-[11px] text-white/30 line-clamp-3 mb-3">
              {file.content.slice(0, 150)}...
            </p>
            <div className="flex items-center gap-1.5">
              <Clock className="h-2.5 w-2.5 text-white/15" />
              <span className="font-mono text-[9px] text-white/20">
                {formatDate(file.updated_at)}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
