'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  TrendingUp,
  Calendar,
  ArrowRight,
  Circle,
  Shield,
  Coins,
  Bot,
  RefreshCw,
  Play,
  ChevronRight,
  Cpu,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Agent metadata
const AGENTS = {
  titus: { name: 'Titus', emoji: '⚡', icon: Shield, color: '#3b82f6', role: 'Operations' },
  looty: { name: 'Looty', emoji: '🪙', icon: Coins, color: '#ffd700', role: 'Revenue' },
  minibolt: { name: 'Mini Bolt', emoji: '🔩', icon: Zap, color: '#00ff41', role: 'Code' },
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg border border-white/[0.1] px-4 py-3 shadow-2xl">
      <p className="mb-2 text-xs text-white/50">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-white/70">{entry.name}: ${Number(entry.value).toFixed(2)}</span>
        </div>
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

function formatCronTime(ms: number) {
  const d = new Date(ms);
  const now = new Date();
  const diffMs = ms - now.getTime();
  const diffHrs = diffMs / 3600000;

  if (diffHrs < 0) return 'overdue';
  if (diffHrs < 1) return Math.round(diffMs / 60000) + 'm';
  if (diffHrs < 24) return Math.round(diffHrs) + 'h';
  return Math.round(diffHrs / 24) + 'd';
}

export default function DashboardView() {
  const [usage, setUsage] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [cronJobs, setCronJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historicalCost, setHistoricalCost] = useState(0);

  // Hardcoded cron jobs from OpenClaw (these come from the gateway, not Supabase)
  const CRON_JOBS = [
    { name: 'Titus Nightly Evolution', schedule: '1:00 AM', nextRun: getTodayAt(1, 0), agent: 'titus', enabled: true },
    { name: 'Looty Nightly Evolution', schedule: '2:00 AM', nextRun: getTodayAt(2, 0), agent: 'looty', enabled: true },
    { name: 'Auto-update check', schedule: '3:00 AM', nextRun: getTodayAt(3, 0), agent: 'titus', enabled: true },
    { name: 'Windows update check', schedule: '3:30 AM', nextRun: getTodayAt(3, 30), agent: 'titus', enabled: true },
    { name: 'Morning brief', schedule: '4:00 AM', nextRun: getTodayAt(4, 0), agent: 'titus', enabled: true },
  ];

  function getTodayAt(hour: number, minute: number) {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    return d.getTime();
  }

  async function fetchAll() {
    const [usageRes, tasksRes, projectsRes, logsRes, finopsRes] = await Promise.all([
      supabase.from('api_usage').select('*').order('ts', { ascending: false }).limit(500),
      supabase.from('tasks').select('*, projects(name)').order('priority', { ascending: false }).limit(20),
      supabase.from('projects').select('*').order('priority', { ascending: false }),
      supabase.from('agent_log').select('*').order('event_time', { ascending: false }).limit(15),
      supabase.from('finops_costs').select('cost'),
    ]);

    setUsage(usageRes.data || []);
    setTasks(tasksRes.data || []);
    setProjects(projectsRes.data || []);
    setLogs(logsRes.data || []);
    // Calculate historical total from finops_costs (pre-cost-logger spend)
    const historicalTotal = (finopsRes.data || []).reduce((s, r) => s + Number(r.cost), 0);
    setHistoricalCost(historicalTotal);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  // Usage calculations
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayUsage = usage.filter(u => new Date(u.ts) >= todayStart);
  const todayCost = todayUsage.reduce((s, u) => s + Number(u.cost_usd), 0);
  const trackedCost = usage.reduce((s, u) => s + Number(u.cost_usd), 0);
  const totalCost = historicalCost + trackedCost;
  const totalCalls = usage.length;

  // Daily chart data from all usage
  const byDay: Record<string, number> = {};
  for (const u of usage) {
    const day = u.ts.split('T')[0];
    byDay[day] = (byDay[day] || 0) + Number(u.cost_usd);
  }
  const chartData = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, cost]) => ({
      day: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      cost,
    }));

  // Task stats
  const openTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
  const doneTasks = tasks.filter(t => t.status === 'done');

  // Agent activity (from recent usage)
  const agentLastSeen: Record<string, string> = {};
  for (const u of usage) {
    if (!agentLastSeen[u.agent]) agentLastSeen[u.agent] = u.ts;
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon/20 border-t-neon" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white/90">Command Center</h2>
          <p className="text-xs text-white/30">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => { setRefreshing(true); fetchAll(); }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-white/25 hover:text-white/50 transition"
        >
          <RefreshCw className={'h-3.5 w-3.5 ' + (refreshing ? 'animate-spin' : '')} />
        </button>
      </div>

      {/* Top row: Key numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-white/30">Today's Spend</span>
            <DollarSign className="h-4 w-4 text-red-400/60" />
          </div>
          <p className="text-2xl font-bold text-white/90">${todayCost.toFixed(2)}</p>
          <p className="text-[10px] text-white/25 mt-1">{todayUsage.length} calls today</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-white/30">All-Time Spend</span>
            <TrendingUp className="h-4 w-4 text-gold/60" />
          </div>
          <p className="text-2xl font-bold text-white/90">${totalCost.toFixed(2)}</p>
          <p className="text-[10px] text-white/25 mt-1">{totalCalls} tracked calls</p>          {historicalCost > 0 && <p className="text-[9px] text-white/15 mt-0.5">incl. ${historicalCost.toFixed(0)} pre-tracked</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-white/30">Open Tasks</span>
            <CheckCircle2 className="h-4 w-4 text-neon/60" />
          </div>
          <p className="text-2xl font-bold text-white/90">{openTasks.length}</p>
          <p className="text-[10px] text-white/25 mt-1">{doneTasks.length} completed</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-white/30">Active Agents</span>
            <Bot className="h-4 w-4 text-agent-titus/60" />
          </div>
          <p className="text-2xl font-bold text-white/90">{Object.keys(agentLastSeen).length}</p>
          <p className="text-[10px] text-white/25 mt-1">of {Object.keys(AGENTS).length} deployed</p>
        </motion.div>
      </div>

      {/* Main grid: 2 columns */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: 2/3 width */}
        <div className="xl:col-span-2 space-y-6">
          {/* Spend chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-white/80">Daily Spend</h3>
                <p className="text-[10px] text-white/25">All-time API costs</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-neon animate-pulse" />
                <span className="text-[9px] text-neon/50">LIVE</span>
              </div>
            </div>
            <div className="h-[220px]">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-white/20">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => '$' + v.toFixed(0)} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="cost" name="Spend" stroke="#3b82f6" strokeWidth={2} fill="url(#gradSpend)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Agent Status Cards */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
            <h3 className="text-sm font-medium text-white/80 mb-4">Agent Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(AGENTS).map(([id, agent]) => {
                const lastSeen = agentLastSeen[id];
                const isActive = lastSeen && (Date.now() - new Date(lastSeen).getTime()) < 3600000;
                const agentUsage = usage.filter(u => u.agent === id);
                const agentCost = agentUsage.reduce((s, u) => s + Number(u.cost_usd), 0);
                const Icon = agent.icon;

                return (
                  <div
                    key={id}
                    className="rounded-xl border border-white/[0.06] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: agent.color + '15' }}>
                          <Icon className="h-4 w-4" style={{ color: agent.color }} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white/80">{agent.name} {agent.emoji}</p>
                          <p className="text-[9px] text-white/25">{agent.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Circle className={'h-2 w-2 ' + (isActive ? 'text-neon fill-neon' : 'text-white/20 fill-white/20')} />
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/25">Spend</span>
                      <span className="text-white/50">${agentCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] mt-1">
                      <span className="text-white/25">Calls</span>
                      <span className="text-white/50">{agentUsage.length}</span>
                    </div>
                    <div className="flex justify-between text-[10px] mt-1">
                      <span className="text-white/25">Last active</span>
                      <span className="text-white/50">{lastSeen ? relativeTime(lastSeen) : 'never'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Activity Feed */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/80">Recent API Activity</h3>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-neon animate-pulse" />
                <span className="text-[9px] text-neon/50">LIVE</span>
              </div>
            </div>
            <div className="space-y-2">
              {usage.slice(0, 12).map((u, i) => {
                const agentMeta = AGENTS[u.agent as keyof typeof AGENTS];
                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: agentMeta?.color || '#888' }} />
                      <span className="text-xs capitalize" style={{ color: agentMeta?.color || '#888' }}>
                        {u.agent}
                      </span>
                      <span className="text-[10px] text-white/30 truncate">
                        {(u.model || '').split('/').pop()} · {formatTokens(u.input_tokens)} in / {formatTokens(u.output_tokens)} out
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-white/50">${Number(u.cost_usd).toFixed(3)}</span>
                      <span className="text-[9px] text-white/20 w-12 text-right">{relativeTime(u.ts)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Right column: 1/3 width */}
        <div className="space-y-6">
          {/* Upcoming Cron Jobs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-gold/60" />
              <h3 className="text-sm font-medium text-white/80">Scheduled Jobs</h3>
            </div>
            <div className="space-y-3">
              {CRON_JOBS.sort((a, b) => a.nextRun - b.nextRun).map((job, i) => {
                const agentMeta = AGENTS[job.agent as keyof typeof AGENTS];
                const timeUntil = formatCronTime(job.nextRun);
                return (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <div className="h-6 w-6 rounded-md flex items-center justify-center" style={{ backgroundColor: (agentMeta?.color || '#888') + '15' }}>
                      <Clock className="h-3 w-3" style={{ color: agentMeta?.color || '#888' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/60 truncate">{job.name}</p>
                      <p className="text-[9px] text-white/25">{job.schedule}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gold/70 font-medium">in {timeUntil}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Tasks */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-neon/60" />
                <h3 className="text-sm font-medium text-white/80">Tasks</h3>
              </div>
              <span className="text-[9px] text-white/20 bg-white/[0.04] px-2 py-0.5 rounded-full">
                {openTasks.length} open
              </span>
            </div>
            <div className="space-y-2">
              {tasks.slice(0, 8).map((task) => {
                const isDone = task.status === 'done';
                return (
                  <div key={task.id} className="flex items-start gap-2 py-1">
                    <div className={'mt-0.5 h-3.5 w-3.5 rounded border flex items-center justify-center flex-shrink-0 ' +
                      (isDone ? 'border-neon/40 bg-neon/10' : 'border-white/10')}>
                      {isDone && <CheckCircle2 className="h-2.5 w-2.5 text-neon" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={'text-xs truncate ' + (isDone ? 'text-white/25 line-through' : 'text-white/60')}>
                        {task.title}
                      </p>
                      {task.projects?.name && (
                        <p className="text-[9px] text-white/15">{task.projects.name}</p>
                      )}
                    </div>
                    {!isDone && task.priority >= 8 && (
                      <span className="text-[8px] text-red-400/60 bg-red-400/[0.08] px-1.5 py-0.5 rounded-full flex-shrink-0">
                        HIGH
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Projects */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-agent-titus/60" />
              <h3 className="text-sm font-medium text-white/80">Projects</h3>
            </div>
            <div className="space-y-3">
              {projects.length === 0 ? (
                <p className="text-xs text-white/20">No projects yet</p>
              ) : (
                projects.map((p) => {
                  const projectTasks = tasks.filter(t => t.project_id === p.id);
                  const done = projectTasks.filter(t => t.status === 'done').length;
                  const total = projectTasks.length;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                  return (
                    <div key={p.id}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-white/60">{p.name}</span>
                        <span className="text-white/25">{done}/{total}</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: pct + '%' }}
                          transition={{ duration: 0.8 }}
                          className="h-full rounded-full bg-neon/50"
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] text-white/15 capitalize">{p.status}</span>
                        <span className="text-[9px] text-white/15">{pct}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-5">
            <h3 className="text-sm font-medium text-white/80 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Check Email', emoji: '📧', action: '/email' },
                { label: 'Run Research', emoji: '🔍', action: '/research' },
                { label: 'Status Report', emoji: '📋', action: '/status' },
                { label: 'Memory Search', emoji: '🧠', action: '/memory' },
              ].map((qa) => (
                <button
                  key={qa.label}
                  onClick={async () => {
                    // Send command to the titus chat thread
                    const { data: threads } = await supabase.from('chat_threads').select('id').eq('agent_id', 'titus').limit(1);
                    if (threads && threads[0]) {
                      await supabase.from('chat_messages').insert({
                        thread_id: threads[0].id,
                        sender: 'user',
                        content: qa.action,
                        metadata: { source: 'quick-action' },
                      });
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.03] transition group active:scale-[0.98]"
                >
                  <span>{qa.emoji}</span>
                  <span className="flex-1">{qa.label}</span>
                  <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
