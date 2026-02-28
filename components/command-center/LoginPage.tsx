'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-space overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-neon/[0.03] via-transparent to-transparent" />

      {/* Ambient grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(0,255,65,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.3) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-neon/[0.08] border border-neon/20 mb-4"
          >
            <Zap className="h-8 w-8 text-neon" />
          </motion.div>
          <h1 className="font-mono text-lg font-bold text-white/90">Command Center</h1>
          <p className="font-mono text-[11px] text-white/30 mt-1">Authentication required</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass-card p-6 space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2"
              >
                <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                <span className="font-mono text-[10px] text-red-300">{error}</span>
              </motion.div>
            )}

            <div>
              <label className="font-mono text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cody@eidrix.ai"
                  required
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 py-2.5 font-mono text-xs text-white/80 placeholder:text-white/15 outline-none focus:border-neon/30 focus:bg-neon/[0.02] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] pl-9 pr-10 py-2.5 font-mono text-xs text-white/80 placeholder:text-white/15 outline-none focus:border-neon/30 focus:bg-neon/[0.02] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors"
                >
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-neon/[0.12] border border-neon/30 py-2.5 font-mono text-xs font-medium text-neon hover:bg-neon/[0.18] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-neon/20 border-t-neon" />
                Authenticating...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="text-center font-mono text-[9px] text-white/15 mt-6">Eidrix Command Center v0.1</p>
      </motion.div>
    </div>
  );
}