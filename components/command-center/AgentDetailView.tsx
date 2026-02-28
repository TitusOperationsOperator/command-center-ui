'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Coins, Zap, Activity, Clock, FileText, Settings, MessageSquare,
  RefreshCw, CheckCircle2, Circle, Cpu, DollarSign, Wrench, ChevronRight,
  File, FolderOpen, Send, Eye,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface AgentDetailViewProps {
  agentId: string;
}

const AGENT_META: Record<string, any> = {
  titus: {
    name: 'Titus', emoji: '⚡', icon: Shield, color: '#3b82f6', role: 'Operations Operator',
    model: 'anthropic/claude-opus-4-6', workspace: 'C:\\Users\\titus\\.openclaw\\workspaceanthropic',
    description: 'Main operations agent. Handles system management, memory, infrastructure, research, and direct conversation with Cody.',
    skills: ['Research Pipeline', 'Email (Gmail)', 'Memory System', 'Obsidian Sync', 'Usage Tracking', 'ChatGPT Mining'],
    mdFiles: ['SOUL.md', 'AGENTS.md', 'USER.md', 'TOOLS.md', 'MEMORY.md', 'HEARTBEAT.md', 'IDENTITY.md'],
  },
  looty: {
    name: 'Looty', emoji: '🪙', icon: Coins, color: '#ffd700', role: 'Revenue Agent',
    model: 'google/gemini-3.1-pro', workspace: 'C:\\Users\\titus\\.openclaw\\workspace-looty',
    description: 'Revenue generation agent. Researches monetization opportunities, runs experiments, tracks budget. $500/mo target.',
    skills: ['Research Pipeline', 'Revenue Analysis', 'Market Research'],
    mdFiles: ['SOUL.md', 'AGENTS.md', 'TOOLS.md', 'MEMORY.md'],
  },
  minibolt: {
    name: 'Mini Bolt', emoji: '🔩', icon: Zap, color: '#00ff41', role: 'Coding Agent',
    model: 'anthropic/claude-opus-4-6', workspace: 'C:\\Users\\titus\\.openclaw\\workspace-minibolt',
    description: 'Shared utility coding agent for building features, scripts, and components. Cheap model for routine code tasks.',
    skills: ['Code Generation', 'File Operations', 'Script Building'],
    mdFiles: ['SOUL.md', 'AGENTS.md', 'TOOLS.md'],
  },
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg border border-white/[0.1] px-3 py-2 shadow-2xl">
      <p className="text-[10px] text-white/50 mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="text-xs text-white/70">${Number(entry.value).toFixed(3)}</div>
      ))}
    </div>
  );
}

function formatTokens(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return String(n);
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}

export default function AgentDetailView({ agentId }: AgentDetailViewProps) {
  const [usage, setUsage] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'skills' | 'files' | 'settings'>('overview');

  const meta = AGENT_META[agentId] || AGENT_META.titus;
  const Icon = meta.icon;

  async function fetchData() {
    const [usageRes, tasksRes, msgsRes] = await Promise.all([
      supabase.from('api_usage').select('*').eq('agent', agentId).order('ts', { ascending: false }).limit(200),
      supabase.from('tasks').select('*, projects(name)').order('priority', { ascending: false }).limit(20),
      supabase.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(20),
    ]);
    setUsage(usageRes.data || []);
    setTasks(tasksRes.data || []);
    setRecentMessages(msgsRes.data || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [agentId]);
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [agentId]);

  // Compute stats
  const totalCost = usage.reduce((s, u) => s + Number(u.cost_usd), 0);
  const totalCalls = usage.length;
  const totalIn = usage.reduce((s, u) => s + u.input_tokens, 0);
  const totalOut = usage.reduce((s, u) => s + u.output_tokens, 0);
  const lastActive = usage.length > 0 ? usage[0].ts : null;
  const isActive = lastActive && (Date.now() - new Date(lastActive).getTime()) < 3600000;

  // Today's stats
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayUsage = usage.filter(u => new Date(u.ts) >= todayStart);
  const todayCost = todayUsage.reduce((s, u) => s + Number(u.cost_usd), 0);

  // Daily chart
  const byDay: Record<string, number> = {};
  for (const u of usage) {
    const day = u.ts.split('T')[0];
    byDay[day] = (byDay[day] || 0) + Number(u.cost_usd);
  }
  const chartData = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b))
    .map(([day, cost]) => ({ day: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cost }));

  const TABS = [
    { id: 'overview' as const, label: 'Overview', icon: Eye },
    { id: 'activity' as const, label: 'Activity', icon: Activity },
    { id: 'skills' as const, label: 'Skills & Tools', icon: Wrench },
    { id: 'files' as const, label: 'Config Files', icon: FileText },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: meta.color }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 overflow-auto">
      {/* Agent header */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: meta.color + '15' }}>
          <Icon className="h-7 w-7" style={{ color: meta.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-white/90">{meta.name} {meta.emoji}</h2>
            <div className="flex items-center gap-1">
              <Circle className={'h-2.5 w-2.5 ' + (isActive ? 'text-neon fill-neon' : 'text-white/20 fill-white/20')} />
              <span className={'text-xs ' + (isActive ? 'text-neon/70' : 'text-white/30')}>
                {isActive ? 'Active' : lastActive ? relativeTime(lastActive) : 'Offline'}
              </span>
            </div>
          </div>
          <p className="text-xs text-white/30 mt-0.5">{meta.role} · {meta.model.split('/').pop()}</p>
          <p className="text-[11px] text-white/20 mt-1">{meta.description}</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-white/[0.06] pb-0.5">
        {TABS.map(tab => {
          const TIcon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={'flex items-center gap-1.5 px-3 py-2 text-xs rounded-t-lg transition-all ' +
                (active ? 'text-white/80 bg-white/[0.04] border-b-2' : 'text-white/30 hover:text-white/50')}
              style={active ? { borderBottomColor: meta.color } : {}}
            >
              <TIcon className="h-3 w-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Today', value: '$' + todayCost.toFixed(2), sub: todayUsage.length + ' calls', icon: DollarSign },
              { label: 'Total Spend', value: '$' + totalCost.toFixed(2), sub: totalCalls + ' calls', icon: DollarSign },
              { label: 'Tokens In', value: formatTokens(totalIn), sub: 'input', icon: Cpu },
              { label: 'Tokens Out', value: formatTokens(totalOut), sub: 'output', icon: Cpu },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-white/30">{s.label}</span>
                  <s.icon className="h-3.5 w-3.5 text-white/15" />
                </div>
                <p className="text-xl font-bold text-white/90">{s.value}</p>
                <p className="text-[10px] text-white/20">{s.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Spend chart */}
          {chartData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
              <h3 className="text-sm font-medium text-white/70 mb-3">Daily Spend</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id={'grad-' + agentId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={meta.color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={meta.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v.toFixed(0)} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="cost" stroke={meta.color} strokeWidth={2} fill={'url(#grad-' + agentId + ')'} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Recent calls */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
            <h3 className="text-sm font-medium text-white/70 mb-3">Recent API Calls</h3>
            <div className="space-y-1.5">
              {usage.slice(0, 10).map((u) => (
                <div key={u.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    <span className="text-[10px] text-white/40">{(u.model || '').split('/').pop()}</span>
                    <span className="text-[10px] text-white/20">{formatTokens(u.input_tokens)} in / {formatTokens(u.output_tokens)} out</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">${Number(u.cost_usd).toFixed(3)}</span>
                    <span className="text-[9px] text-white/15">{relativeTime(u.ts)}</span>
                  </div>
                </div>
              ))}
              {usage.length === 0 && <p className="text-xs text-white/20 text-center py-4">No activity yet</p>}
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white/70">Full Activity Log</h3>
          <div className="space-y-1">
            {usage.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-white/[0.03] hover:bg-white/[0.02] transition">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
                  <span className="text-xs text-white/50">{(u.model || '').split('/').pop()}</span>
                  <span className="text-[10px] text-white/20 truncate">
                    {formatTokens(u.input_tokens)} in / {formatTokens(u.output_tokens)} out
                    {u.channel && ' · ' + u.channel}
                    {u.session_key && ' · ' + u.session_key.substring(0, 8) + '...'}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-white/50">${Number(u.cost_usd).toFixed(4)}</span>
                  <span className="text-[9px] text-white/20 w-20 text-right">
                    {new Date(u.ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {usage.length === 0 && <p className="text-xs text-white/20 text-center py-8">No activity recorded</p>}
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-white/70 mb-3">Active Skills</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {meta.skills.map((skill: string) => (
                <div key={skill} className="glass-card p-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: meta.color + '10' }}>
                    <Wrench className="h-4 w-4" style={{ color: meta.color + '80' }} />
                  </div>
                  <div>
                    <p className="text-xs text-white/70">{skill}</p>
                    <p className="text-[9px] text-neon/50">Active</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-white/70 mb-3">Model Info</h3>
            <div className="glass-card p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/30">Model</span>
                <span className="text-white/60">{meta.model}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/30">Workspace</span>
                <span className="text-white/60 text-[10px] truncate max-w-[300px]">{meta.workspace}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/30">Total Spend</span>
                <span className="text-white/60">${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/30">Avg Cost/Call</span>
                <span className="text-white/60">${totalCalls > 0 ? (totalCost / totalCalls).toFixed(4) : '0'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'files' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white/70">Configuration Files</h3>
          <p className="text-[10px] text-white/20">Workspace: {meta.workspace}</p>
          <div className="space-y-2">
            {meta.mdFiles.map((file: string) => (
              <div key={file} className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-white/[0.04] hover:bg-white/[0.02] transition cursor-pointer group">
                <FileText className="h-4 w-4 text-white/20" />
                <span className="text-xs text-white/60 flex-1">{file}</span>
                <ChevronRight className="h-3 w-3 text-white/10 group-hover:text-white/30 transition" />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white/70">Agent Settings</h3>
          <div className="glass-card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-white/60">Model</p>
                <p className="text-[10px] text-white/25">Primary model for this agent</p>
              </div>
              <div className="text-xs text-white/50 bg-white/[0.04] px-3 py-1.5 rounded-lg">{meta.model}</div>
            </div>
            <div className="border-t border-white/[0.04]" />
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-white/60">Workspace</p>
                <p className="text-[10px] text-white/25">Agent working directory</p>
              </div>
              <div className="text-[10px] text-white/50 bg-white/[0.04] px-3 py-1.5 rounded-lg max-w-[250px] truncate">{meta.workspace}</div>
            </div>
            <div className="border-t border-white/[0.04]" />
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-white/60">Status</p>
                <p className="text-[10px] text-white/25">Current operational status</p>
              </div>
              <div className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ' + (isActive ? 'bg-neon/10 text-neon/70' : 'bg-white/[0.04] text-white/30')}>
                <Circle className={'h-2 w-2 ' + (isActive ? 'fill-neon text-neon' : 'fill-white/20 text-white/20')} />
                {isActive ? 'Online' : 'Idle'}
              </div>
            </div>
            <div className="border-t border-white/[0.04]" />
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-white/60">Telegram</p>
                <p className="text-[10px] text-white/25">Bot delivery channel</p>
              </div>
              <div className="text-xs text-white/50 bg-white/[0.04] px-3 py-1.5 rounded-lg">
                {agentId === 'looty' ? '@LoonyLootybot' : agentId === 'titus' ? 'Main Bot' : 'Not configured'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
