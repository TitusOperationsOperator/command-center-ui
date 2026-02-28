'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, Trash2, Download, FolderOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useContextMenu } from '../ContextMenuProvider';
import { useToast } from '../Toast';

interface FileRecord {
  id: string;
  filename: string;
  storage_path: string;
  content_type: string;
  size_bytes: number;
  uploaded_by: string;
  created_at: string;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function FilesView() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { show: showCtx } = useContextMenu();
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);

  const fetchFiles = useCallback(async () => {
    const { data } = await supabase
      .from('file_uploads')
      .select('*')
      .order('created_at', { ascending: false });
    setFiles(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  async function uploadFiles(fileList: FileList | File[]) {
    setUploading(true);
    const arr = Array.from(fileList);

    for (const file of arr) {
      const storagePath = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

      const { error: uploadErr } = await supabase.storage
        .from('uploads')
        .upload(storagePath, file, { contentType: file.type });

      if (uploadErr) {
        console.error('Upload failed:', uploadErr);
        continue;
      }

      await supabase.from('file_uploads').insert({
        filename: file.name,
        storage_path: storagePath,
        content_type: file.type,
        size_bytes: file.size,
        uploaded_by: 'user',
      });
    }

    setUploading(false);
    fetchFiles();
  }

  async function deleteFile(file: FileRecord) {
    await supabase.storage.from('uploads').remove([file.storage_path]);
    await supabase.from('file_uploads').delete().eq('id', file.id);
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
  }

  function getDownloadUrl(storagePath: string) {
    const { data } = supabase.storage.from('uploads').getPublicUrl(storagePath);
    return data.publicUrl;
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <div className="flex items-center gap-2">
        <FolderOpen className="h-5 w-5 text-neon/60" />
        <h2 className="font-mono text-lg font-medium text-white/80">Files</h2>
        <span className="font-mono text-xs text-white/30 ml-2">{files.length} files</span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={"relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer " + (
          dragOver ? 'border-neon/50 bg-neon/5' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
        )}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.onchange = (e: any) => {
            if (e.target.files?.length) uploadFiles(e.target.files);
          };
          input.click();
        }}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-neon/30 border-t-neon" />
            <span className="font-mono text-xs text-neon/70">Uploading...</span>
          </div>
        ) : (
          <>
            <Upload className={"mx-auto h-8 w-8 mb-2 " + (dragOver ? 'text-neon/70' : 'text-white/20')} />
            <p className="font-mono text-xs text-white/40">
              Drop files here or click to browse
            </p>
            <p className="font-mono text-[10px] text-white/20 mt-1">
              Up to 50MB per file
            </p>
          </>
        )}
      </div>

      {/* File list */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-neon/30 border-t-neon" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center font-mono text-xs text-white/30 py-12">
            No files uploaded yet
          </div>
        ) : (
          files.map((file, i) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 glass-card p-3 group"
            >
              <File className="h-4 w-4 text-neon/40 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-white/70 truncate">{file.filename}</p>
                <p className="font-mono text-[10px] text-white/30">
                  {formatBytes(file.size_bytes)} · {file.content_type || 'unknown'} · {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>
              <a
                href={getDownloadUrl(file.storage_path)}
                target="_blank"
                rel="noreferrer"
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/20 hover:text-neon hover:bg-neon/10 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => deleteFile(file)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
