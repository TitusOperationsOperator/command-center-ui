'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Image as ImageIcon,
  Wrench,
  Search,
  Globe,
  Calculator,
  FileText,
  ChevronUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useGatewayStatus, useGatewayChat } from '@/hooks/useGateway';
import { getGatewayConfig } from '@/lib/gateway';
import { useContextMenu } from './ContextMenuProvider';
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import type { AgentId, ChatThread, ChatMessage as ChatMsg } from './types';
import { AGENT_CONFIG, AGENT_IDS } from './types';

interface Attachment {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  isImage: boolean;
}

interface ChatPaneProps {
  activeAgent: AgentId;
  onSelectAgent: (agent: AgentId) => void;
  activeThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
}

const TOOLS = [
  { id: 'search', name: 'Web Search', icon: Search, desc: 'Search the internet' },
  { id: 'browse', name: 'Browse', icon: Globe, desc: 'Visit a webpage' },
  { id: 'analyze', name: 'Analyze Data', icon: Calculator, desc: 'Crunch numbers' },
  { id: 'research', name: 'Deep Research', icon: FileText, desc: 'In-depth research' },
];

export default function ChatPane({
  activeAgent,
  onSelectAgent,
  activeThreadId,
  onSelectThread,
}: ChatPaneProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);
  const [showTools, setShowTools] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const gatewayStatus = useGatewayStatus();
  const gatewayChat = useGatewayChat(activeAgent);
  const scrollRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const agent = AGENT_CONFIG[activeAgent];
  const slashMatches = matchCommands(input);

  // Deduplicate messages by ID
  const uniqueMessages = useMemo(() => {
    const seen = new Map<string, ChatMsg>();
    messages.forEach((msg) => {
      if (!seen.has(msg.id)) {
        seen.set(msg.id, msg);
      }
    });
    return Array.from(seen.values());
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    }
  }, []);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
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

  // REAL-TIME with reconnection logic
  useEffect(() => {
    if (!activeThreadId) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isSubscribed = false;

    const setupChannel = () => {
      if (channel) {
        supabase.removeChannel(channel);
      }

      channel = supabase
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
              if (prev.find((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            const sender = (newMsg.agent_name || '').toLowerCase();
            if (sender !== 'user' && sender !== 'cody') {
              setIsTyping(false);
            }
            scrollToBottom();
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);

          if (status === 'SUBSCRIBED') {
            setRealtimeStatus('connected');
            reconnectAttemptsRef.current = 0;
            isSubscribed = true;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setRealtimeStatus('disconnected');
            isSubscribed = false;

            // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            reconnectAttemptsRef.current++;

            console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
            setRealtimeStatus('reconnecting');

            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }

            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('Attempting to reconnect...');
              setupChannel();
            }, delay);
          }
        });
    };

    setupChannel();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [activeThreadId, scrollToBottom]);

  // Poll backup
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

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  useEffect(() => { setSlashIndex(0); }, [input]);

  // Handle paste for images
  function handlePaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter((item) => item.kind === 'file' && item.type.startsWith('image/'));
    if (imageItems.length === 0) return;
    e.preventDefault();
    imageItems.forEach((item) => {
      const file = item.getAsFile();
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [...prev, {
          name: file.name || `screenshot-${Date.now()}.png`,
          type: file.type,
          size: file.size,
          dataUrl: reader.result as string,
          isImage: true,
        }]);
      };
      reader.readAsDataURL(file);
    });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [...prev, {
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result as string,
          isImage: file.type.startsWith('image/'),
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  function removeAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  async function uploadAttachment(att: Attachment) {
    const res = await fetch(att.dataUrl);
    const blob = await res.blob();
    const storagePath = Date.now() + '-' + att.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const { error } = await supabase.storage.from('uploads').upload(storagePath, blob, { contentType: att.type });
    if (error) return null;
    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(storagePath);
    await supabase.from('file_uploads').insert({
      filename: att.name,
      storage_path: storagePath,
      content_type: att.type,
      size_bytes: att.size,
      uploaded_by: 'user',
    });
    return { storagePath, publicUrl: urlData.publicUrl };
  }

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
    if (!renameValue.trim()) { setRenamingId(null); return; }
    await supabase.from('chat_threads').update({ title: renameValue.trim() }).eq('id', id);
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, title: renameValue.trim() } : t)));
    setRenamingId(null);
  }

  async function togglePin(thread: ChatThread) {
    const newPinned = !thread.pinned;
    await supabase.from('chat_threads').update({ pinned: newPinned }).eq('id', thread.id);
    setThreads((prev) => prev.map((t) => (t.id === thread.id ? { ...t, pinned: newPinned } : t)));
  }

  async function deleteThread(id: string) {
    await supabase.from('chat_threads').delete().eq('id', id);
    const remaining = threads.filter((t) => t.id !== id);
    setThreads(remaining);
    if (activeThreadId === id) {
      if (remaining.length > 0) {
        onSelectThread(remaining[0].id);
      } else {
        const { data } = await supabase.from('chat_threads').insert({ agent_id: activeAgent, title: 'General' }).select().maybeSingle();
        if (data) { setThreads([data]); onSelectThread(data.id); }
      }
    }
  }

  async function clearChat() {
    if (!activeThreadId) return;
    if (!window.confirm('Delete all messages in this thread? This cannot be undone.')) return;
    const { error } = await supabase.from('chat_messages').delete().eq('thread_id', activeThreadId);
    if (!error) {
      setMessages([]);
    }
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if ((!input.trim() && attachments.length === 0) || !activeThreadId || sending) return;

    if (slashMatches.length > 0 && input.startsWith('/') && !input.includes(' ')) {
      setInput(slashMatches[slashIndex].name + ' ');
      return;
    }

    const msg = input.trim();
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);
    setSending(true);
    setIsTyping(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const uploadedFiles: string[] = [];
      for (const att of currentAttachments) {
        const result = await uploadAttachment(att);
        if (result) {
          uploadedFiles.push(`[${att.isImage ? 'Image' : 'File'}: ${att.name}](${result.publicUrl}) (${formatBytes(att.size)})`);
        }
      }
      const parts = [];
      if (msg) parts.push(msg);
      if (uploadedFiles.length > 0) parts.push(uploadedFiles.join('\n'));
      const fullMessage = parts.join('\n\n');
      if (!fullMessage) return;

      // Store user message in Supabase for history
      await sendChatMessage(activeThreadId, fullMessage, 'Cody');

      // Try gateway for real agent response
      if (gatewayStatus.connected && getGatewayConfig().token) {
        try {
          const agentResponse = await gatewayChat.send(
            [{ role: 'user', content: fullMessage }],
            undefined, // onToken Ã¢â‚¬â€ streaming text updates handled by hook
            async (response) => {
              // Store agent response in Supabase for history
              if (response && response.trim()) {
                await sendChatMessage(activeThreadId, response, agent.name);
              }
              setIsTyping(false);
            },
            (error) => {
              console.error('Gateway error:', error);
              setIsTyping(false);
            },
          );
        } catch (err) {
          console.error('Gateway send failed, message stored in Supabase only:', err);
          setIsTyping(false);
        }
      }
    } catch (err) {
      console.error('Send failed:', err);
      setInput(msg);
      setAttachments(currentAttachments);
      setIsTyping(false);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (slashMatches.length > 0) {
      if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIndex((p) => Math.max(0, p - 1)); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIndex((p) => Math.min(slashMatches.length - 1, p + 1)); }
      else if (e.key === 'Tab') { e.preventDefault(); setInput(slashMatches[slashIndex].name + ' '); }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleToolSelect(toolId: string) {
    setShowTools(false);
    setInput((prev) => (prev ? prev + ' ' : '') + '/' + toolId + ' ');
    textareaRef.current?.focus();
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
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
              <Icon className="h-3.5 w-3.5" style={{ color: isActive ? cfg.color : cfg.color + '60' }} />
              {isActive && (
                <motion.div
                  layoutId="agent-ring"
                  className="absolute inset-0 rounded-full border-[1.5px]"
                  style={{ borderColor: cfg.color + '50' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <div className={'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-space-card ' + (cfg.status === 'online' ? 'bg-neon' : 'bg-gold')} />
            </motion.button>
          );
        })}
        <div className="flex-1" />
        {/* Gateway status indicator */}
        {gatewayStatus.connected ? (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-[9px] text-green-400" title={'Gateway connected (' + gatewayStatus.latency + 'ms)'}>
            <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
            Live
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] text-[9px] text-white/20" title="Gateway offline Ã¢â‚¬â€ messages stored only">
            <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
            Local
          </div>
        )}
        <button onClick={createThread} className="flex h-6 w-6 items-center justify-center rounded-md text-white/25 transition-colors hover:bg-white/[0.05] hover:text-white/50">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Thread list */}
      <div className="flex-shrink-0 overflow-y-auto scrollbar-thin border-b border-white/[0.06]" style={{ maxHeight: '35%' }}>
        {loadingThreads ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: agent.color + '30', borderTopColor: agent.color }} />
          </div>
        ) : (
          threads.map((thread) => {
            const isActive = activeThreadId === thread.id;
            const isRenaming = renamingId === thread.id;
            return (
              <button
                key={thread.id}
                onClick={() => !isRenaming && onSelectThread(thread.id)}
                className={'group relative flex w-full items-center gap-2 px-3 py-2 text-left transition-all ' + (isActive ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]')}
              >
                {isActive && (
                  <motion.div layoutId="thread-active" className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full" style={{ backgroundColor: agent.color, boxShadow: '0 0 6px ' + agent.color + '60' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
                {thread.pinned && <Pin className="h-2.5 w-2.5 flex-shrink-0 rotate-45 text-white/20" />}
                <div className="flex flex-1 flex-col min-w-0">
                  {isRenaming ? (
                    <form onSubmit={(e) => { e.preventDefault(); renameThread(thread.id); }} className="flex items-center gap-1">
                      <input ref={renameInputRef} value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onBlur={() => renameThread(thread.id)} className="flex-1 bg-transparent text-xs text-white/80 outline-none" />
                      <button type="submit" className="text-neon/60 hover:text-neon"><Check className="h-3 w-3" /></button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setRenamingId(null); }} className="text-white/30 hover:text-white/60"><X className="h-3 w-3" /></button>
                    </form>
                  ) : (
                    <>
                      <span className={'truncate text-xs ' + (isActive ? 'text-white/80' : 'text-white/50')}>{thread.title}</span>
                      <span className="text-[10px] text-white/20">{relativeTime(thread.updated_at)}</span>
                    </>
                  )}
                </div>
                {!isRenaming && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div role="button" onClick={(e) => e.stopPropagation()} className="flex h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/[0.08]">
                        <MoreHorizontal className="h-3 w-3 text-white/30" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[140px] border-white/[0.08] bg-space-card">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenamingId(thread.id); setRenameValue(thread.title); }} className="gap-2 text-xs text-white/60"><Pencil className="h-3 w-3" /> Rename</DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(thread); }} className="gap-2 text-xs text-white/60"><Pin className="h-3 w-3" /> {thread.pinned ? 'Unpin' : 'Pin to Top'}</DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteThread(thread.id); }} className="gap-2 text-xs text-red-400/80"><Trash2 className="h-3 w-3" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </button>
            );
          })
        )}
      </div>

            {/* Messages */}
      <div className="relative flex-1 overflow-hidden flex flex-col">
        {/* Reconnection banner */}
        <AnimatePresence>
          {realtimeStatus !== 'connected' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-center gap-2 border-b border-white/[0.06] bg-yellow-500/10 px-3 py-2"
            >
              <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
              <span className="text-[10px] text-yellow-400">
                {realtimeStatus === 'disconnected' ? 'Connection lost' : 'Reconnecting...'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat header */}
        {activeThreadId && uniqueMessages.length > 0 && (
          <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
            <span className="text-xs text-white/40">{uniqueMessages.length} message{uniqueMessages.length !== 1 ? 's' : ''}</span>
            <button onClick={clearChat} className="flex h-6 items-center gap-1.5 rounded-md px-2 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400" title="Clear all messages">
              <Trash2 className="h-3 w-3" />
              <span className="text-[10px]">Clear</span>
            </button>
          </div>
        )}
        <div ref={scrollRef} className="h-full overflow-y-auto scrollbar-thin p-3 space-y-3">
          {loadingMessages ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: agent.color + '30', borderTopColor: agent.color }} />
            </div>
          ) : uniqueMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: agent.color + '15' }}>
                <agent.icon className="h-6 w-6" style={{ color: agent.color + '60' }} />
              </div>
              <span className="text-sm text-white/30">Message {agent.name}</span>
              <span className="text-xs text-white/15">Type / for commands or just start talking</span>
            </div>
          ) : (
            uniqueMessages.map((msg, i) => (
              <ChatMessage key={msg.id} agentName={msg.agent_name} content={msg.content} timestamp={formatTime(msg.created_at)} index={i} />
            ))
          )}
          <AnimatePresence>
            {streamingText && (
              <ChatMessage
                agentName="Titus"
                content={streamingText}
                timestamp="streaming..."
                index={uniqueMessages.length}
              />
            )}
            {isTyping && !streamingText && <TypingIndicator agentName={agent.name} color={agent.color} />}
          </AnimatePresence>
        </div>
      </div>

      {/* ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â UPGRADED INPUT AREA ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â */}
      <div className="relative border-t border-white/[0.06]">
        {/* Slash hints */}
        <AnimatePresence>
          {slashMatches.length > 0 && (
            <SlashHints commands={slashMatches} onSelect={(cmd) => setInput(cmd)} selectedIndex={slashIndex} />
          )}
        </AnimatePresence>

        {/* Attachment previews */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-2 px-3 pt-3 pb-1 flex-wrap">
              {attachments.map((att, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative group">
                  {att.isImage ? (
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-white/[0.08]">
                      <img src={att.dataUrl} alt={att.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-16 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3">
                      <FileText className="h-4 w-4 text-white/30" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white/50 max-w-[80px] truncate">{att.name}</span>
                        <span className="text-[9px] text-white/20">{formatBytes(att.size)}</span>
                      </div>
                    </div>
                  )}
                  <button onClick={() => removeAttachment(i)} className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.txt,.json,.csv,.md,.doc,.docx,.xls,.xlsx" onChange={handleFileSelect} className="hidden" />

        {/* Main input area */}
        <div className="px-3 py-2.5">
          {/* Textarea + Send */}
          <div className="flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 transition-all focus-within:border-white/[0.15] focus-within:bg-white/[0.04]" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); resizeTextarea(); }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={'Message ' + agent.name + '...'}
              disabled={sending}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-white/85 placeholder:text-white/20 outline-none py-1.5 leading-relaxed"
              style={{ minHeight: '24px', maxHeight: '160px' }}
            />

            {/* Send button */}
            <div className="pb-0.5">
              <motion.button
                type="button"
                onClick={() => handleSend()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                disabled={(!input.trim() && attachments.length === 0) || sending}
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: (input.trim() || attachments.length > 0) && !sending ? agent.color + '20' : 'transparent',
                  color: (input.trim() || attachments.length > 0) && !sending ? agent.color : 'rgba(255,255,255,0.15)',
                }}
              >
                {sending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: agent.color + '60' }} />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Bottom bar: actions left, hints right */}
          <div className="flex items-center justify-between px-1 pt-1.5">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 transition-all hover:text-white/45 hover:bg-white/[0.05]" title="Attach file or image">
                <Paperclip className="h-3.5 w-3.5" />
              </button>

              <DropdownMenu open={showTools} onOpenChange={setShowTools}>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="flex h-7 items-center gap-1 rounded-lg px-2 text-white/20 transition-all hover:text-white/45 hover:bg-white/[0.05]">
                    <Wrench className="h-3 w-3" />
                    <span className="text-[10px]">Tools</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="min-w-[200px] border-white/[0.08] bg-space-card/95 backdrop-blur-xl mb-1">
                  <DropdownMenuLabel className="text-[10px] text-white/30 uppercase tracking-wider">Tools</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/[0.06]" />
                  {TOOLS.map((tool) => {
                    const TIcon = tool.icon;
                    return (
                      <DropdownMenuItem key={tool.id} onClick={() => handleToolSelect(tool.id)} className="gap-3 py-2 text-white/60 hover:text-white/90 cursor-pointer">
                        <TIcon className="h-4 w-4" style={{ color: agent.color + '80' }} />
                        <div className="flex flex-col">
                          <span className="text-xs">{tool.name}</span>
                          <span className="text-[10px] text-white/30">{tool.desc}</span>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <span className="text-[10px] text-white/10">ÃƒÂ¢Ã‚ÂÃ…Â½ Send Ãƒâ€šÃ‚Â· ÃƒÂ¢Ã¢â‚¬Â¡Ã‚Â§ÃƒÂ¢Ã‚ÂÃ…Â½ New line</span>
          </div>
        </div>
      </div>
    </div>
  );
}












