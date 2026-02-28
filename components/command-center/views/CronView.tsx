'use client';

import { motion } from 'framer-motion';
import { Clock, Play, Pause, Calendar } from 'lucide-react';

const CRON_JOBS = [
  {
    name: 'Titus Nightly Evolution',
    schedule: '1:00 AM MST',
    model: 'openai/gpt-4.1-mini',
    description: '2 self-improvements per night',
    status: 'active',
    lastRun: '2026-02-27 01:00',
    nextRun: '2026-02-28 01:00',
  },
  {
    name: 'Looty Nightly Evolution',
    schedule: '2:00 AM MST',
    model: 'openai/gpt-4.1-mini',
    description: '2 self-improvements per night',
    status: 'active',
    lastRun: '2026-02-27 02:00',
    nextRun: '2026-02-28 02:00',
  },
  {
    name: 'Auto-Update Check',
    schedule: '3:00 AM MST',
    model: 'system',
    description: 'Check for OpenClaw updates',
    status: 'active',
    lastRun: '2026-02-27 03:00',
    nextRun: '2026-02-28 03:00',
  },
  {
    name: 'Windows Update Check',
    schedule: '3:30 AM MST',
    model: 'system',
    description: 'Windows update scan',
    status: 'active',
    lastRun: '2026-02-27 03:30',
    nextRun: '2026-02-28 03:30',
  },
  {
    name: 'Morning Brief',
    schedule: '4:00 AM MST',
    model: 'openai/gpt-4.1-mini',
    description: 'Daily briefing to Cody via Telegram',
    status: 'active',
    lastRun: '2026-02-27 04:00',
    nextRun: '2026-02-28 04:00',
  },
];

export default function CronView() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-neon/60" />
        <h2 className="font-mono text-lg font-medium text-white/80">Cron Jobs</h2>
        <span className="font-mono text-xs text-white/30 ml-2">{CRON_JOBS.length} scheduled</span>
      </div>

      <div className="space-y-3">
        {CRON_JOBS.map((job, i) => (
          <motion.div
            key={job.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className={'h-2.5 w-2.5 rounded-full ' + (job.status === 'active' ? 'bg-neon animate-pulse' : 'bg-white/20')} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-xs font-medium text-white/80">{job.name}</h3>
                  <span className="font-mono text-[9px] text-neon/50 border border-neon/20 rounded-full px-1.5 py-0.5">{job.schedule}</span>
                </div>
                <p className="font-mono text-[10px] text-white/40 mt-0.5">{job.description}</p>
                <div className="flex gap-4 mt-1">
                  <span className="font-mono text-[9px] text-white/25">Model: {job.model}</span>
                  <span className="font-mono text-[9px] text-white/25">Last: {job.lastRun}</span>
                  <span className="font-mono text-[9px] text-white/25">Next: {job.nextRun}</span>
                </div>
              </div>
              <Clock className="h-4 w-4 text-white/15 flex-shrink-0" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}