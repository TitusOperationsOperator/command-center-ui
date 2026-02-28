import { Shield, DollarSign, Zap } from 'lucide-react';

export type AgentId = 'titus' | 'looty' | 'bolt';

export interface ChatThread {
  id: string;
  agent_id: AgentId;
  title: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  agent_name: string;
  content: string;
  thread_id: string | null;
  created_at: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  pinned: boolean;
  type?: string;
  data?: any;
}

export const AGENT_CONFIG: Record<
  AgentId,
  {
    name: string;
    subtitle: string;
    icon: React.ElementType;
    color: string;
    borderColor: string;
    bgColor: string;
    status: 'online' | 'working';
    agentKey: string; // maps to api_usage.agent
  }
> = {
  titus: {
    name: 'Titus',
    subtitle: 'Main Ops',
    icon: Shield,
    color: '#3b82f6',
    borderColor: 'border-agent-titus/40',
    bgColor: 'bg-agent-titus/10',
    status: 'online',
    agentKey: 'titus',
  },
  looty: {
    name: 'Looty',
    subtitle: 'Revenue Updates',
    icon: DollarSign,
    color: '#ffd700',
    borderColor: 'border-agent-looty/40',
    bgColor: 'bg-agent-looty/10',
    status: 'working',
    agentKey: 'looty',
  },
  bolt: {
    name: 'Mini Bolt',
    subtitle: 'Build Logs',
    icon: Zap,
    color: '#00ff41',
    borderColor: 'border-agent-bolt/40',
    bgColor: 'bg-agent-bolt/10',
    status: 'online',
    agentKey: 'minibolt',
  },
};

export const AGENT_IDS: AgentId[] = ['titus', 'looty', 'bolt'];
