'use client';

import { useAuth } from '@/lib/auth';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Wifi, Database, Bell, Moon, Sun, Clock, Cpu } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import GatewaySetup from '../GatewaySetup';

const CRON_JOBS = [
  { job: 'Titus Nightly Evolution', schedule: '1:00 AM', model: 'GPT-4.1 Mini' },
  { job: 'YouTube Research', schedule: '1:30 AM', model: 'GPT-4.1 Mini' },
  { job: 'Looty Nightly Evolution', schedule: '2:00 AM', model: 'GPT-4.1 Mini' },
  { job: 'Auto-update check', schedule: '3:00 AM', model: 'GPT-4.1 Mini' },
  { job: 'Windows update check', schedule: '3:30 AM', model: 'GPT-4.1 Mini' },
  { job: 'Morning brief', schedule: '4:00 AM', model: 'GPT-4.1 Mini' },
  { job: 'Sync API usage', schedule: 'Every 4h', model: 'GPT-4.1 Mini' },
  { job: 'Sync Looty Dashboard', schedule: 'Every 30min', model: 'GPT-4.1 Mini' },
];

const MODEL_ASSIGNMENTS = [
  { agent: 'Titus', model: 'Claude Opus 4.6', cost: '$15/$75 per 1M', color: '#3b82f6' },
  { agent: 'Looty', model: 'Claude Sonnet 4.5', cost: '$3/$15 per 1M', color: '#ffd700' },
  { agent: 'Mini Bolt', model: 'Claude Sonnet 4.5', cost: '$3/$15 per 1M', color: '#22c55e' },
  { agent: 'Heartbeats/Cron', model: 'GPT-4.1 Mini', cost: '$0.40/$1.60 per 1M', color: '#a855f7' },
];

export default function SettingsView() {
  const { user, signOut } = useAuth();
  const [health, setHealth] = useState<any>(null);
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    const start = Date.now();
    supabase.from('memories').select('id', { count: 'exact', head: true }).then(({ count }) => {
      setHealth({
        supabasePing: Date.now() - start,
        connected: true,
        memoryCount: count || 0,
      });
    }).then(null, () => {
      setHealth({ connected: false, supabasePing: -1, memoryCount: 0 });
    });
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-neon/60" />
        <h2 className="text-lg font-medium text-white/80">Settings</h2>
      </div>

      {/* Connection */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wifi className="h-4 w-4 text-neon/50" />
          <h3 className="text-sm font-medium text-white/70">Connection</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Supabase</span>
            <span className={'text-xs ' + (health?.connected ? 'text-neon' : 'text-red-400')}>{health?.connected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Ping</span>
            <span className="text-xs text-white/70">{health?.supabasePing ?? '...'}ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Gateway</span>
            <span className="text-xs text-white/40">localhost:18789 (bridge required)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Chat Bridge</span>
            <span className="text-xs text-neon">Active (auto-restart)</span>
          </div>
        </div>
      </motion.div>

      {/* Gateway */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
        <GatewaySetup />
      </motion.div>

      {/* Cron Jobs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-neon/50" />
          <h3 className="text-sm font-medium text-white/70">Cron Jobs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-left">
                <th className="pb-2 pr-4 text-white/40 font-medium">Job</th>
                <th className="pb-2 pr-4 text-white/40 font-medium">Schedule</th>
                <th className="pb-2 text-white/40 font-medium">Model</th>
              </tr>
            </thead>
            <tbody>
              {CRON_JOBS.map((job, idx) => (
                <tr key={idx} className="border-b border-white/[0.03]">
                  <td className="py-2 pr-4 text-white/60">{job.job}</td>
                  <td className="py-2 pr-4 text-white/50">{job.schedule}</td>
                  <td className="py-2 text-white/50">{job.model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Model Assignments */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="h-4 w-4 text-neon/50" />
          <h3 className="text-sm font-medium text-white/70">Model Assignments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-left">
                <th className="pb-2 pr-4 text-white/40 font-medium">Agent</th>
                <th className="pb-2 pr-4 text-white/40 font-medium">Primary Model</th>
                <th className="pb-2 text-white/40 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {MODEL_ASSIGNMENTS.map((assignment, idx) => (
                <tr key={idx} className="border-b border-white/[0.03]">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: assignment.color }} />
                      <span className="text-white/60">{assignment.agent}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-white/50">{assignment.model}</td>
                  <td className="py-2 text-white/50">{assignment.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Moon className="h-4 w-4 text-neon/50" />
          <h3 className="text-sm font-medium text-white/70">Appearance</h3>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">Theme</span>
          <span className="text-xs text-white/70">Dark (glassmorphism)</span>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-neon/50" />
          <h3 className="text-sm font-medium text-white/70">Notifications</h3>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">Browser notifications</span>
          <span className="text-xs text-white/40">Coming soon</span>
        </div>
      </motion.div>

      {/* About */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-neon/50" />
          <h3 className="text-sm font-medium text-white/70">About</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Command Center</span>
            <span className="text-xs text-white/70">v0.5.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">OpenClaw</span>
            <span className="text-xs text-white/70">2026.2.26</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Stack</span>
            <span className="text-xs text-white/70">Next.js + Supabase + Vercel</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Repo</span>
            <a href="https://github.com/TitusOperationsOperator/command-center-ui" target="_blank" rel="noreferrer" className="text-xs text-neon/60 hover:text-neon">GitHub</a>
          </div>
        </div>
      </motion.div>
        {/* Account */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5 space-y-3">
          <h3 className="text-xs font-medium text-white/50">Account</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/70">{user?.email || "Not signed in"}</p>
              <p className="text-[10px] text-white/30">{user?.user_metadata?.name || "User"} â€¢ {user?.id?.slice(0, 8)}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-1.5 text-[10px] text-red-400 hover:bg-red-500/[0.12] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </motion.div>
    </div>
  );
}
