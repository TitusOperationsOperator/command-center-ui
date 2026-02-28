'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Database, Wifi, Key, Server, Globe, Volume2 } from 'lucide-react';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30"
            style={{ zIndex: 9998 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-0 top-0 bottom-0 w-[380px] border-l border-white/[0.08] shadow-2xl overflow-y-auto"
            style={{ zIndex: 9999, background: 'rgba(10, 12, 20, 0.97)', backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-white/40" />
                <span className="text-sm font-medium text-white/70">Settings</span>
              </div>
              <button onClick={onClose} className="text-white/20 hover:text-white/50 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Connection */}
              <div>
                <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Connection</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-3.5 w-3.5 text-neon/50" />
                      <span className="text-xs text-white/60">Gateway</span>
                    </div>
                    <span className="text-[10px] text-neon/50 bg-neon/[0.06] px-2 py-0.5 rounded">Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-3.5 w-3.5 text-neon/50" />
                      <span className="text-xs text-white/60">Supabase</span>
                    </div>
                    <span className="text-[10px] text-neon/50 bg-neon/[0.06] px-2 py-0.5 rounded">Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-neon/50" />
                      <span className="text-xs text-white/60">Telegram</span>
                    </div>
                    <span className="text-[10px] text-neon/50 bg-neon/[0.06] px-2 py-0.5 rounded">Active</span>
                  </div>
                </div>
              </div>

              {/* API Info */}
              <div>
                <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">API Providers</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Anthropic', key: 'sk-ant-a...YXO8IgAA', status: 'active' },
                    { name: 'OpenAI', key: 'sk-proj-r...XOOIA', status: 'active' },
                    { name: 'Google', key: 'AIzaS...configured', status: 'active' },
                  ].map((api) => (
                    <div key={api.name} className="flex items-center justify-between py-2 px-3 rounded-lg border border-white/[0.04] bg-white/[0.02]">
                      <div>
                        <p className="text-xs text-white/60">{api.name}</p>
                        <p className="text-[9px] text-white/20 font-mono">{api.key}</p>
                      </div>
                      <span className="text-[9px] text-neon/50">●</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agents */}
              <div>
                <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Agent Fleet</h3>
                <div className="space-y-2">
                  {[
                    { name: 'Titus ⚡', model: 'claude-opus-4-6', status: 'primary' },
                    { name: 'Looty 🪙', model: 'gemini-3.1-pro', status: 'active' },
                    { name: 'Mini Bolt 🔩', model: 'claude-opus-4-6', status: 'active' },
                  ].map((agent) => (
                    <div key={agent.name} className="flex items-center justify-between py-2 px-3 rounded-lg border border-white/[0.04]">
                      <span className="text-xs text-white/60">{agent.name}</span>
                      <span className="text-[10px] text-white/30">{agent.model}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cron Schedule */}
              <div>
                <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Cron Schedule</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { time: '1:00 AM', job: 'Titus Evolution' },
                    { time: '2:00 AM', job: 'Looty Evolution' },
                    { time: '3:00 AM', job: 'Auto-update' },
                    { time: '3:30 AM', job: 'Windows update' },
                    { time: '4:00 AM', job: 'Morning brief' },
                    { time: 'Every 4h', job: 'API usage sync' },
                  ].map((cron) => (
                    <div key={cron.job} className="flex items-center justify-between text-white/40">
                      <span>{cron.job}</span>
                      <span className="text-white/20">{cron.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Version */}
              <div className="pt-4 border-t border-white/[0.04]">
                <div className="flex justify-between text-[10px] text-white/15">
                  <span>OpenClaw v2026.2.26</span>
                  <span>Command Center v1.0</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
