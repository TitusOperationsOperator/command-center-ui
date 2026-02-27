'use client';

import { motion } from 'framer-motion';
import { Shield, DollarSign, Zap, User } from 'lucide-react';

interface ChatMessageProps {
  agentName: string;
  content: string;
  timestamp: string;
  index: number;
}

const agentConfig: Record<string, {
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  icon: React.ElementType;
  label: string;
}> = {
  Titus: {
    color: '#3b82f6',
    bgClass: 'bg-agent-titus/[0.06]',
    borderClass: 'border-agent-titus/20',
    textClass: 'text-agent-titus',
    icon: Shield,
    label: 'SUPERVISOR',
  },
  Looty: {
    color: '#ffd700',
    bgClass: 'bg-agent-looty/[0.06]',
    borderClass: 'border-agent-looty/20',
    textClass: 'text-agent-looty',
    icon: DollarSign,
    label: 'FINOPS',
  },
  'Mini Bolt': {
    color: '#00ff41',
    bgClass: 'bg-agent-bolt/[0.06]',
    borderClass: 'border-agent-bolt/20',
    textClass: 'text-agent-bolt',
    icon: Zap,
    label: 'EXECUTOR',
  },
  User: {
    color: '#ffffff',
    bgClass: 'bg-white/[0.04]',
    borderClass: 'border-white/[0.1]',
    textClass: 'text-white/90',
    icon: User,
    label: 'OPERATOR',
  },
};

export default function ChatMessage({ agentName, content, timestamp, index }: ChatMessageProps) {
  const config = agentConfig[agentName] || agentConfig.User;
  const isUser = agentName === 'User';
  const AgentIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${config.borderClass} ${config.bgClass}`}
      >
        <AgentIcon className={`h-4 w-4 ${config.textClass}`} />
      </div>

      <div className={`flex max-w-[80%] flex-col gap-1 ${isUser ? 'items-end' : ''}`}>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-[11px] font-semibold ${config.textClass}`}>
            {agentName}
          </span>
          <span className="font-mono text-[9px] tracking-widest text-white/20">
            {config.label}
          </span>
          <span className="font-mono text-[9px] text-white/15">{timestamp}</span>
        </div>
        <div
          className={`rounded-lg border px-4 py-3 ${config.borderClass} ${config.bgClass}`}
          style={{
            boxShadow: `0 0 20px -8px ${config.color}15`,
          }}
        >
          <p className="font-mono text-[13px] leading-relaxed text-white/75">
            {content}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
