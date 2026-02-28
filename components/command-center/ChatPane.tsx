'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Plus,
  MoreHorizontal,
  Pin,
  Pencil,
  Trash2,
  Check,
  X,
  Paperclip,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { sendChatMessage } from '@/lib/api';
import { matchCommands } from '@/lib/commands';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import SlashHints from './SlashHints';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AgentId, ChatThread, ChatMessage as ChatMsg } from './types';
import { AGENT_CONFIG, AGENT_IDS } from './types';

interface ChatPaneProps {
  activeAgent: AgentId;
  onSelectAgent: (agent: AgentId) => void;
  activeThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
}

export default function ChatPane({
  activeAgent,
  onSelectAgent,
  activeThreadId,
  onSelectThread,
}: ChatPaneProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const agent = AGENT_CONFIG[activeAgent];
  const slashMatches = matchCommands(input);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    }
  }, []);

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    const { data } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('agent_id', activeAgent)
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (data) {
      setThreads(data);
      if (!activeThreadId || !data.find((t) => t.id === activeThreadId)) {
        onSelectThread(data[0]?.id ?? null);
      }
    }
    setLoadingThreads(false);
  }, [activeAgent, activeThreadId, onSelectThread]);

  useEffect(() => {
    setLoadingThreads(true);
    fetchThreads();
  }, [activeAgent]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', activeThreadId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
    setLoadingMessages(false);
    scrollToBottom();
  }, [activeThreadId, scrollToBottom]);

  useEffect(() => {
    fetchMessages();
  }, [activeThreadId]);

  // REAL-TIME: Subscribe to new messages in active thread
  useEffect(() => {
    if (!activeThreadId) return;

    const channel = supabase
      .channel('chat-realtime-' + activeThreadId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: 'thread_id=eq.' + activeThreadId,
        },
        (payload) => {
          const newMsg = payload.new as ChatMsg;
          setMessages((prev) => {
            // Deduplicate
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // If it's from an agent, stop typing indicator
          const sender = (newMsg.agent_name || '').toLowerCase();
          if (sender !== 'user' && sender !== 'cody') {
            setIsTyping(false);
          }
          scrollToBottom();
        }
      )
      .subscribe((status) => {
        console.log('[ChatPane] Realtime status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeThreadId, scrollToBottom]);

  // Also poll every 5s as backup for realtime
  useEffect(() => {
    if (!activeThreadId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', activeThreadId)
        .order('created_at', { ascending: true });
      if (data && data.length !== messages.length) {
        setMessages(data);
        setIsTyping(false);
        scrollToBottom();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeThreadId, messages.length, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Reset slash index when input changes
  useEffect(() => {
    setSlashIndex(0);
  }, [input]);

  async function createThread() {
    const { data } = await supabase
      .from('chat_threads')
      .insert({ agent_id: activeAgent, title: 'New Thread' })
      .select()
      .maybeSingle();

    if (data) {
      setThreads((prev) => [data, ...prev]);
      onSelectThread(data.id);
      setRenamingId(data.id);
      setRenameValue(data.title);
    }
  }

  async function renameThread(id: string) {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    await supabase
      .from('chat_threads')
      .update({ title: renameValue.trim() })
      .eq('id', id);

    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: renameValue.trim() } : t))
    );
    setRenamingId(null);
  }

  async function togglePin(thread: ChatThread) {
    const newPinned = !thread.pinned;
    await supabase
      .from('chat_threads')
      .update({ pinned: newPinned })
      .eq('id', thread.id);

    setThreads((prev) =>
      prev.map((t) => (t.id === thread.id ? { ...t, pinned: newPinned } : t))
    );
  }

  async function deleteThread(id: string) {
    await supabase.from('chat_threads').delete().eq('id', id);

    const remaining = threads.filter((t) => t.id !== id);
    setThreads(remaining);

    if (activeThreadId === id) {
      if (remaining.length > 0) {
        onSelectThread(remaining[0].id);
      } else {
        const { data } = await supabase
          .from('chat_threads')
          .insert({ agent_id: activeAgent, title: 'General' })
          .select()
          .maybeSingle();
        if (data) {
          setThreads([data]);
          onSelectThread(data.id);
        }
      }
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !activeThreadId || sending) return;

    // Handle slash command selection
    if (slashMatches.length > 0 && input.startsWith('/') && !input.includes(' ')) {
      setInput(slashMatches[slashIndex].name + ' ');
      return;
    }

    const msg = input.trim();
    setInput('');
    setSending(true);
    setIsTyping(true);

    try {
      await sendChatMessage(activeThreadId, msg, 'Cody');
    } catch (err) {
      console.error('Send failed:', err);
      setInput(msg);
      setIsTyping(false);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (slashMatches.length > 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashIndex((prev) => Math.min(slashMatches.length - 1, prev + 1));
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setInput(slashMatches[slashIndex].name + ' ');
      }
    }
  }

  async function handleFileUpload() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.onchange = async (e: any) => {
      const files = Array.from(e.target.files || []) as File[];
      for (const file of files) {
        const storagePath = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const { error } = await supabase.storage
          .from('uploads')
          .upload(storagePath, file, { contentType: file.type });

        if (!error) {
          const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(storagePath);
          await sendChatMessage(
            activeThreadId!,
            '[File: ' + file.name + '](' + urlData.publicUrl + ') (' + formatBytes(file.size) + ')',
            'Cody'
          );
          await supabase.from('file_uploads').insert({
            filename: file.name,
            storage_path: storagePath,
            content_type: file.type,
            size_bytes: file.size,
            uploaded_by: 'user',
          });
        }
      }
    };
    fileInput.click();
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  function relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return mins + 'm';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h';
    return Math.floor(hrs / 24) + 'd';
  }

  return (
    <div className="flex h-full flex-col bg-space-card/50 backdrop-blur-xl">
      {/* Agent selector */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
        {AGENT_IDS.map((id) => {
          const cfg = AGENT_CONFIG[id];
          const isActive = activeAgent === id;
          const Icon = cfg.icon;
          return (
            <motion.button
              key={id}
              onClick={() => onSelectAgent(id)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] transition-all"
              style={{
                borderColor: isActive ? cfg.color + '70' : cfg.color + '20',
                boxShadow: isActive ? '0 0 12px ' + cfg.color + '30' : 'none',
                backgroundColor: isActive ? cfg.color + '12' : 'transparent',
              }}
            >
              <Icon
                className="h-3.5 w-3.5"
                style={{ color: isActive ? cfg.color : cfg.color + '60' }}
              />
              {isActive && (
                <motion.div
                  layoutId="agent-ring"
                  className="absolute inset-0 rounded-full border-[1.5px]"
                  style={{ borderColor: cfg.color + '50' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <div
                className={'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-space-card ' +
                  (cfg.status === 'online' ? 'bg-neon' : 'bg-gold')}
              />
            </motion.button>
          );
        })}

        <div className="flex-1" />
        <button
          onClick={createThread}
          className="flex h-6 w-6 items-center justify-center rounded-md text-white/25 transition-colors hover:bg-white/[0.05] hover:text-white/50"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Thread list */}
      <div className="flex-shrink-0 overflow-y-auto scrollbar-thin border-b border-white/[0.06]"
        style={{ maxHeight: '35%' }}
      >
        {loadingThreads ? (
          <div className="flex items-center justify-center py-6">
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: agent.color + '30', borderTopColor: agent.color }}
            />
          </div>
        ) : (
          threads.map((thread) => {
            const isActive = activeThreadId === thread.id;
            const isRenaming = renamingId === thread.id;

            return (
              <button
                key={thread.id}
                onClick={() => !isRenaming && onSelectThread(thread.id)}
                className={'group relative flex w-full items-center gap-2 px-3 py-2 text-left transition-all ' +
                  (isActive ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]')}
              >
                {isActive && (
                  <motion.div
                    layoutId="thread-active"
                    className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full"
                    style={{
                      backgroundColor: agent.color,
                      boxShadow: '0 0 6px ' + agent.color + '60',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {thread.pinned && (
                  <Pin className="h-2.5 w-2.5 flex-shrink-0 rotate-45 text-white/20" />
                )}

                <div className="flex flex-1 flex-col min-w-0">
                  {isRenaming ? (
                    <form
                      onSubmit={(e) => { e.preventDefault(); renameThread(thread.id); }}
                      className="flex items-center gap-1"
                    >
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => renameThread(thread.id)}
                        className="flex-1 bg-transparent font-mono text-[11px] text-white/80 outline-none"
                      />
                      <button type="submit" className="text-neon/60 hover:text-neon">
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setRenamingId(null); }}
                        className="text-white/30 hover:text-white/60"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className={'truncate font-mono text-[11px] ' + (isActive ? 'text-white/80' : 'text-white/50')}>
                        {thread.title}
                      </span>
                      <span className="font-mono text-[9px] text-white/20">
                        {relativeTime(thread.updated_at)}
                      </span>
                    </>
                  )}
                </div>

                {!isRenaming && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div
                        role="button"
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/[0.08]"
                      >
                        <MoreHorizontal className="h-3 w-3 text-white/30" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="min-w-[140px] border-white/[0.08] bg-space-card"
                    >
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); setRenamingId(thread.id); setRenameValue(thread.title); }}
                        className="gap-2 font-mono text-[11px] text-white/60"
                      >
                        <Pencil className="h-3 w-3" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); togglePin(thread); }}
                        className="gap-2 font-mono text-[11px] text-white/60"
                      >
                        <Pin className="h-3 w-3" />
                        {thread.pinned ? 'Unpin' : 'Pin to Top'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); deleteThread(thread.id); }}
                        className="gap-2 font-mono text-[11px] text-red-400/80"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Messages */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.01]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
            }}
          />
        </div>

        <div
          ref={scrollRef}
          className="h-full overflow-y-auto scrollbar-thin p-3 space-y-2.5"
        >
          {loadingMessages ? (
            <div className="flex h-full items-center justify-center">
              <div
                className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: agent.color + '30', borderTopColor: agent.color }}
              />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <agent.icon className="h-6 w-6 text-white/10" />
              <span className="font-mono text-[11px] text-white/20">
                Send a message to {agent.name}
              </span>
              <span className="font-mono text-[9px] text-white/15">
                Type / to see available commands
              </span>
            </div>
          ) : (
            messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                agentName={msg.agent_name}
                content={msg.content}
                timestamp={formatTime(msg.created_at)}
                index={i}
              />
            ))
          )}

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <TypingIndicator agentName={agent.name} color={agent.color} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input with slash hints */}
      <div className="relative">
        <AnimatePresence>
          {slashMatches.length > 0 && (
            <SlashHints
              commands={slashMatches}
              onSelect={(cmd) => setInput(cmd)}
              selectedIndex={slashIndex}
            />
          )}
        </AnimatePresence>

        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t border-white/[0.06] bg-space-card/30 px-3 py-2 backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={handleFileUpload}
            className="flex h-6 w-6 items-center justify-center rounded-md text-white/20 hover:text-white/40 hover:bg-white/[0.05] transition-colors"
          >
            <Paperclip className="h-3.5 w-3.5" />
          </button>
          <div
            className="font-mono text-[10px] select-none"
            style={{ color: agent.color + '40' }}
          >
            &gt;_
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={'Message ' + agent.name + '... (type / for commands)'}
            className="flex-1 bg-transparent font-mono text-xs text-white/80 placeholder:text-white/15 outline-none"
            disabled={sending}
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!input.trim() || sending}
            className="flex h-6 w-6 items-center justify-center rounded-md border transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            style={{
              borderColor: agent.color + '30',
              backgroundColor: agent.color + '10',
              color: agent.color + '90',
            }}
          >
            {sending ? (
              <div className="h-3 w-3 animate-spin rounded-full border border-t-transparent" style={{ borderColor: agent.color + '60' }} />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
