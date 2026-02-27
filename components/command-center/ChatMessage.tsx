'use client';

import { motion } from 'framer-motion';

interface ChatMessageProps {
  agentName: string;
  content: string;
  timestamp: string;
  index: number;
}

function renderContent(content: string) {
  // Simple markdown link rendering: [text](url)
  const parts = content.split(/(\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="text-neon/80 underline underline-offset-2 hover:text-neon transition-colors"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatMessage({
  agentName,
  content,
  timestamp,
  index,
}: ChatMessageProps) {
  const isUser = agentName === 'User' || agentName === 'Cody';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className={'flex gap-2 ' + (isUser ? 'flex-row-reverse' : '')}
    >
      <div
        className={'max-w-[85%] rounded-lg px-3 py-2 ' + (
          isUser
            ? 'bg-neon/10 border border-neon/20'
            : 'bg-white/[0.04] border border-white/[0.06]'
        )}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className={'font-mono text-[10px] font-medium ' + (isUser ? 'text-neon/70' : 'text-white/50')}>
            {agentName}
          </span>
          <span className="font-mono text-[9px] text-white/20">{timestamp}</span>
        </div>
        <div className="font-mono text-[11px] text-white/80 whitespace-pre-wrap break-words leading-relaxed">
          {renderContent(content)}
        </div>
      </div>
    </motion.div>
  );
}
