'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Coins, Zap, Activity, Clock, FileText, Settings, MessageSquare,
  RefreshCw, CheckCircle2, Circle, Cpu, DollarSign, Wrench, ChevronRight,
  File, FolderOpen, Send, Eye, Play, Mail, Search, Database, Download,
  Copy, ExternalLink, TrendingUp, Target, Package, Megaphone, BarChart3,
  Code, GitBranch, Terminal,
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
    name: 'Titus', emoji: '⚡', icon: Shield, color: '#3b82f6',
    avatarUrl: 'https://eyekkfedhknhyevocgoa.supabase.co/storage/v1/object/public/images/agent/titus-avatar.jpg',
    role: 'Operations Operator', tagline: 'Infrastructure. Memory. Execution.',
    model: 'anthropic/claude-opus-4-6', workspace: 'C:\\Users\\titus\\.openclaw\\workspaceanthropic',
    description: 'Main operations agent. Manages system infrastructure, memory, research, dashboards, and direct ops with Cody.',
    skills: [
      { name: 'Research Pipeline', icon: Search, status: 'active' },
      { name: 'Email (Gmail)', icon: Mail, status: 'active' },
      { name: 'Memory System', icon: Database, status: 'active' },
      { name: 'Usage Tracking', icon: BarChart3, status: 'active' },
      { name: 'Web Search', icon: Search, status: 'active' },
      { name: 'Browser Control', icon: ExternalLink, status: 'active' },
    ],
    actions: [
      { label: 'Check Email', icon: Mail, command: '/check email' },
      { label: 'Run Research', icon: Search, command: '/research' },
      { label: 'Sync Usage', icon: RefreshCw, command: '/sync usage' },
      { label: 'Status Report', icon: BarChart3, command: '/status' },
      { label: 'Memory Search', icon: Database, command: '/memory search' },
      { label: 'Spawn Subagent', icon: Play, command: '/spawn' },
    ],
    mdFiles: ['SOUL.md', 'AGENTS.md', 'USER.md', 'TOOLS.md', 'MEMORY.md', 'HEARTBEAT.md', 'IDENTITY.md'],
  },
  looty: {
    name: 'Looty', emoji: '🪙', icon: Coins, color: '#ffd700',
    avatarUrl: null,
    role: 'Revenue Agent', tagline: 'Find money. Make money. Track money.',
    model: 'google/gemini-3.1-pro', workspace: 'C:\\Users\\titus\\.openclaw\\workspace-looty',
    description: 'Revenue generation agent. Builds digital products, runs experiments, tracks budget. $500/mo target.',
    skills: [
      { name: 'Research Pipeline', icon: Search, status: 'active' },
      { name: 'Market Analysis', icon: TrendingUp, status: 'active' },
      { name: 'Content Creation', icon: Megaphone, status: 'active' },
      { name: 'Product Building', icon: Package, status: 'active' },
    ],
    actions: [
      { label: 'Product Status', icon: Package, command: '/product status' },
      { label: 'View Drafts', icon: FileText, command: '/drafts' },
      { label: 'Budget Check', icon: DollarSign, command: '/budget' },
      { label: 'Launch Prep', icon: Target, command: '/launch' },
    ],
    mdFiles: ['SOUL.md', 'AGENTS.md', 'TOOLS.md', 'MEMORY.md', 'budget-tracker.md', 'opportunity-log.md', 'phase2-plan.md'],
  },
  minibolt: {
    name: 'Mini Bolt', emoji: '🔩', icon: Zap, color: '#22c55e',
    avatarUrl: null,
    role: 'Coding Agent', tagline: 'Build fast. Ship faster.',
    model: 'anthropic/claude-opus-4-6', workspace: 'C:\\Users\\titus\\.openclaw\\workspace-minibolt',
    description: 'Shared utility coding agent. Builds features, scripts, UI components. Handles the heavy code lifting.',
    skills: [
      { name: 'Code Generation', icon: Code, status: 'active' },
      { name: 'File Operations', icon: File, status: 'active' },
      { name: 'Git Operations', icon: GitBranch, status: 'active' },
      { name: 'Script Building', icon: Terminal, status: 'active' },
    ],
    actions: [
      { label: 'Build Component', icon: Code, command: '/build' },
      { label: 'Run Script', icon: Terminal, command: '/run' },
      { label: 'Git Status', icon: GitBranch, command: '/git status' },
      { label: 'Task Queue', icon: CheckCircle2, command: '/tasks' },
    ],
    mdFiles: ['SOUL.md', 'AGENTS.md', 'TOOLS.md'],
  },
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/[0.1] px-3 py-2 shadow-2xl" style={{ background: 'rgba(10,12,20,0.95)' }}>
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

// Looty-specific: Product & Content tab
function LootyProductTab({ color }: { color: string }) {
  const [products, setProducts] = useState<any>(null);
  const [contentFiles, setContentFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load dashboard status
    fetch('/api/looty-status').catch(() => {});
    // For now use static data from what we know
    setProducts({
      name: 'The 2026 AI Freelance Catalyst',
      subtitle: '50+ Prompts to Save 10 Hours a Week',
      price: '$29',
      platform: 'Gumroad',
      status: 'Building',
      completionPct: 85,
      files: [
        { name: 'Client Acquisition Prompts', file: 'prompts-client-acquisition.md', type: 'product', count: '18+ prompts' },
        { name: 'Workflow Efficiency Prompts', file: 'prompts-workflow-efficiency.md', type: 'product', count: '18+ prompts' },
        { name: 'Client Comms Prompts', file: 'prompts-client-comms.md', type: 'product', count: '18+ prompts' },
        { name: 'Gumroad Listing Copy', file: 'gumroad-listing.md', type: 'listing' },
      ],
    });
    setContentFiles([
      'twitter-threads.md',
      'linkedin-posts.md',
      'reddit-post.md',
    ]);
    setLoading(false);
  }, []);

  if (loading || !products) return <div className="text-xs text-white/20 text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Product card */}
      <div className="rounded-xl border-2 p-5" style={{ borderColor: color + '30', background: color + '08' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-5 w-5" style={{ color }} />
              <h3 className="text-base font-semibold text-white/90">{products.name}</h3>
            </div>
            <p className="text-xs text-white/40">{products.subtitle}</p>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold" style={{ color }}>{products.price}</span>
            <p className="text-[10px] text-white/30">{products.platform}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-white/40">Progress</span>
            <span style={{ color }}>{products.completionPct}%</span>
          </div>
          <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: products.completionPct + '%' }}
              transition={{ duration: 1 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
            />
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px]" style={{ background: color + '15', color: color }}>
            <Circle className="h-1.5 w-1.5 fill-current" />
            {products.status}
          </div>
        </div>
      </div>

      {/* Product files */}
      <div>
        <h4 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
          <Package className="h-4 w-4" style={{ color: color + '80' }} />
          Product Files
        </h4>
        <div className="space-y-2">
          {products.files.map((f: any) => (
            <div key={f.file} className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-white/[0.04] hover:bg-white/[0.02] transition cursor-pointer group">
              <FileText className="h-4 w-4 text-white/20" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/60">{f.name}</p>
                {f.count && <p className="text-[9px] text-white/20">{f.count}</p>}
              </div>
              <Copy className="h-3 w-3 text-white/10 group-hover:text-white/30 transition" />
            </div>
          ))}
        </div>
      </div>

      {/* Marketing content */}
      <div>
        <h4 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
          <Megaphone className="h-4 w-4" style={{ color: color + '80' }} />
          Marketing Content
        </h4>
        <div className="space-y-2">
          {contentFiles.map((f) => (
            <div key={f} className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-white/[0.04] hover:bg-white/[0.02] transition cursor-pointer group">
              <Megaphone className="h-4 w-4 text-white/20" />
              <span className="text-xs text-white/60 flex-1">{f.replace('.md', '').replace(/-/g, ' ')}</span>
              <Copy className="h-3 w-3 text-white/10 group-hover:text-white/30 transition" />
            </div>
          ))}
        </div>
      </div>

      {/* Experiment tracker */}
      <div className="glass-card p-4">
        <h4 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
          <Target className="h-4 w-4" style={{ color: color + '80' }} />
          Experiment #1
        </h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-white/30">Product</span><span className="text-white/60">AI Freelance Catalyst</span></div>
          <div className="flex justify-between"><span className="text-white/30">Platform</span><span className="text-white/60">Gumroad</span></div>
          <div className="flex justify-between"><span className="text-white/30">Price</span><span style={{ color }}>$29</span></div>
          <div className="flex justify-between"><span className="text-white/30">Target</span><span className="text-white/60">&gt;1.5% conversion</span></div>
          <div className="flex justify-between"><span className="text-white/30">Kill criteria</span><span className="text-white/60">500 views, 0 sales, 14 days</span></div>
          <div className="flex justify-between"><span className="text-white/30">Budget spent</span><span className="text-white/60">$0 / $500</span></div>
          <div className="flex justify-between"><span className="text-white/30">Revenue</span><span style={{ color }}>$0</span></div>
        </div>
      </div>
    </div>
  );
}

export default function AgentDetailView({ agentId }: AgentDetailViewProps) {
  const [usage, setUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const meta = AGENT_META[agentId] || AGENT_META.titus;
  const Icon = meta.icon;

  async function fetchData() {
    const usageRes = await supabase.from('api_usage').select('*').eq('agent', agentId).order('ts', { ascending: false }).limit(200);
    setUsage(usageRes.data || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [agentId]);
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [agentId]);

  // Stats
  const totalCost = usage.reduce((s, u) => s + Number(u.cost_usd), 0);
  const totalCalls = usage.length;
  const totalIn = usage.reduce((s, u) => s + u.input_tokens, 0);
  const totalOut = usage.reduce((s, u) => s + u.output_tokens, 0);
  const lastActive = usage.length > 0 ? usage[0].ts : null;
  const isActive = lastActive && (Date.now() - new Date(lastActive).getTime()) < 3600000;

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayUsage = usage.filter(u => new Date(u.ts) >= todayStart);
  const todayCost = todayUsage.reduce((s, u) => s + Number(u.cost_usd), 0);

  // Chart
  const byDay: Record<string, number> = {};
  for (const u of usage) { const day = u.ts.split('T')[0]; byDay[day] = (byDay[day] || 0) + Number(u.cost_usd); }
  const chartData = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b))
    .map(([day, cost]) => ({ day: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cost }));

  // Dynamic tabs per agent
  const getTabs = () => {
    const base = [
      { id: 'overview', label: 'Overview', icon: Eye },
      { id: 'actions', label: 'Actions', icon: Play },
    ];
    if (agentId === 'looty') {
      base.push({ id: 'product', label: 'Product & Content', icon: Package });
    }
    if (agentId === 'minibolt') {
      base.push({ id: 'builds', label: 'Builds', icon: Code });
    }
    base.push(
      { id: 'skills', label: 'Skills', icon: Wrench },
      { id: 'files', label: 'Files', icon: FileText },
      { id: 'activity', label: 'Activity', icon: Activity },
      { id: 'settings', label: 'Settings', icon: Settings },
    );
    return base;
  };

  const TABS = getTabs();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: meta.color }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 overflow-auto">
      {/* Agent header with avatar */}
      <div className="flex items-center gap-5">
        {meta.avatarUrl ? (
          <img src={meta.avatarUrl} alt={meta.name} className="h-16 w-16 rounded-2xl object-cover border-2" style={{ borderColor: meta.color + '40' }} />
        ) : (
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center border-2" style={{ backgroundColor: meta.color + '12', borderColor: meta.color + '30' }}>
            <Icon className="h-8 w-8" style={{ color: meta.color }} />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white/90">{meta.name} {meta.emoji}</h2>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px]" style={{ background: isActive ? meta.color + '15' : 'rgba(255,255,255,0.04)', color: isActive ? meta.color : 'rgba(255,255,255,0.3)' }}>
              <Circle className={'h-2 w-2 ' + (isActive ? 'fill-current' : '')} />
              {isActive ? 'Active' : lastActive ? relativeTime(lastActive) : 'Offline'}
            </div>
          </div>
          <p className="text-sm text-white/40 mt-0.5">{meta.role}</p>
          <p className="text-[11px] text-white/20 italic mt-0.5">{meta.tagline}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-2xl font-bold" style={{ color: meta.color }}>${totalCost.toFixed(2)}</p>
          <p className="text-[10px] text-white/25">{totalCalls} calls total</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-thin border-b border-white/[0.06] pb-0.5">
        {TABS.map(tab => {
          const TIcon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={'flex items-center gap-1.5 px-3 py-2 text-xs rounded-t-lg transition-all whitespace-nowrap ' +
                (active ? 'text-white/80 bg-white/[0.04]' : 'text-white/25 hover:text-white/45')}
              style={active ? { borderBottom: `2px solid ${meta.color}` } : {}}
            >
              <TIcon className="h-3 w-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Today', value: '$' + todayCost.toFixed(2), sub: todayUsage.length + ' calls' },
              { label: 'Total Spend', value: '$' + totalCost.toFixed(2), sub: totalCalls + ' calls' },
              { label: 'Tokens In', value: formatTokens(totalIn), sub: 'input' },
              { label: 'Tokens Out', value: formatTokens(totalOut), sub: 'output' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4">
                <span className="text-[10px] uppercase tracking-widest text-white/25">{s.label}</span>
                <p className="text-xl font-bold text-white/90 mt-1">{s.value}</p>
                <p className="text-[10px] text-white/20">{s.sub}</p>
              </motion.div>
            ))}
          </div>

          {chartData.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-medium text-white/60 mb-3">Daily Spend</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id={'grad-' + agentId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={meta.color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={meta.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v.toFixed(0)} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="cost" stroke={meta.color} strokeWidth={2} fill={'url(#grad-' + agentId + ')'} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === ACTIONS TAB === */}
      {activeTab === 'actions' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-white/60 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {meta.actions.map((action: any) => {
                const AIcon = action.icon;
                return (
                  <button
                    key={action.label}
                    className="glass-card p-4 flex items-center gap-3 hover:bg-white/[0.04] transition group text-left"
                  >
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: meta.color + '10' }}>
                      <AIcon className="h-5 w-5 transition-colors" style={{ color: meta.color + '80' }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/70 group-hover:text-white/90 transition">{action.label}</p>
                      <p className="text-[9px] text-white/20 font-mono">{action.command}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-4">
            <h4 className="text-xs text-white/40 mb-2">Send Command</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={'Message ' + meta.name + '...'}
                className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/15 outline-none focus:border-white/[0.12] transition"
              />
              <button className="px-4 py-2 rounded-lg text-xs font-medium transition" style={{ backgroundColor: meta.color + '20', color: meta.color }}>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === LOOTY PRODUCT TAB === */}
      {activeTab === 'product' && agentId === 'looty' && (
        <LootyProductTab color={meta.color} />
      )}

      {/* === MINI BOLT BUILDS TAB === */}
      {activeTab === 'builds' && agentId === 'minibolt' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white/60">Build Lab</h3>
          <div className="glass-card p-5 text-center">
            <Code className="h-8 w-8 text-white/10 mx-auto mb-3" />
            <p className="text-xs text-white/30">No active builds</p>
            <p className="text-[10px] text-white/15 mt-1">Mini Bolt will show build output and task progress here</p>
          </div>
        </div>
      )}

      {/* === SKILLS TAB === */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <h3 className="text-sm font-medium text-white/60">Active Skills</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {meta.skills.map((skill: any) => {
              const SIcon = skill.icon;
              return (
                <div key={skill.name} className="glass-card p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: meta.color + '10' }}>
                    <SIcon className="h-4 w-4" style={{ color: meta.color + '80' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/70">{skill.name}</p>
                    <p className="text-[9px]" style={{ color: meta.color + '70' }}>● Active</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass-card p-4 space-y-2">
            <h4 className="text-xs text-white/40 mb-2">Agent Config</h4>
            <div className="flex justify-between text-xs"><span className="text-white/25">Model</span><span className="text-white/50 font-mono">{meta.model}</span></div>
            <div className="flex justify-between text-xs"><span className="text-white/25">Workspace</span><span className="text-white/50 font-mono text-[10px] truncate max-w-[280px]">{meta.workspace}</span></div>
            <div className="flex justify-between text-xs"><span className="text-white/25">Total Spend</span><span style={{ color: meta.color }}>${totalCost.toFixed(2)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-white/25">Avg Cost/Call</span><span className="text-white/50">${totalCalls > 0 ? (totalCost / totalCalls).toFixed(4) : '0'}</span></div>
          </div>
        </div>
      )}

      {/* === FILES TAB === */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white/60">Configuration Files</h3>
          <p className="text-[10px] text-white/15 font-mono">{meta.workspace}</p>
          <div className="space-y-1.5">
            {meta.mdFiles.map((file: string) => (
              <div key={file} className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-white/[0.04] hover:bg-white/[0.02] transition cursor-pointer group">
                <FileText className="h-4 w-4 text-white/15" />
                <span className="text-xs text-white/50 flex-1 font-mono">{file}</span>
                <ChevronRight className="h-3 w-3 text-white/10 group-hover:text-white/25 transition" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === ACTIVITY TAB === */}
      {activeTab === 'activity' && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/60">API Activity</h3>
          {usage.length === 0 ? (
            <p className="text-xs text-white/20 text-center py-8">No activity recorded</p>
          ) : (
            <div className="space-y-1">
              {usage.slice(0, 30).map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
                    <span className="text-[10px] text-white/40">{(u.model || '').split('/').pop()}</span>
                    <span className="text-[10px] text-white/15">{formatTokens(u.input_tokens)} in / {formatTokens(u.output_tokens)} out</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-white/40">${Number(u.cost_usd).toFixed(3)}</span>
                    <span className="text-[9px] text-white/15 w-20 text-right">
                      {new Date(u.ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === SETTINGS TAB === */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white/60">Agent Settings</h3>
          <div className="glass-card p-5 space-y-4">
            {[
              { label: 'Model', value: meta.model, sub: 'Primary model' },
              { label: 'Workspace', value: meta.workspace, sub: 'Working directory' },
              { label: 'Status', value: isActive ? 'Online' : 'Idle', sub: 'Operational status', isStatus: true },
              { label: 'Telegram', value: agentId === 'looty' ? '@LoonyLootybot' : agentId === 'titus' ? 'Main Bot' : 'Not configured', sub: 'Bot channel' },
            ].map((item, i) => (
              <div key={item.label}>
                {i > 0 && <div className="border-t border-white/[0.04] mb-4" />}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-white/50">{item.label}</p>
                    <p className="text-[10px] text-white/20">{item.sub}</p>
                  </div>
                  <div
                    className={'text-xs px-3 py-1.5 rounded-lg ' + (item.isStatus
                      ? (isActive ? '' : 'bg-white/[0.04] text-white/30')
                      : 'bg-white/[0.04] text-white/50 font-mono text-[10px] max-w-[250px] truncate')}
                    style={item.isStatus && isActive ? { background: meta.color + '15', color: meta.color } : {}}
                  >
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
