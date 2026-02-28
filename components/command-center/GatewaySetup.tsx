'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, CheckCircle2, AlertCircle, Eye, EyeOff, Zap } from 'lucide-react';
import { getGatewayConfig, setGatewayConfig, pingGateway } from '@/lib/gateway';

export default function GatewaySetup() {
  const [url, setUrl] = useState('http://localhost:18789');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    const config = getGatewayConfig();
    if (config.url) setUrl(config.url);
    if (config.token) setToken(config.token);
    // Auto-test on mount
    testConnection(config.url, config.token);
  }, []);

  async function testConnection(testUrl?: string, testToken?: string) {
    setStatus('testing');
    // Temporarily set config for ping
    const config = { url: testUrl || url, token: testToken || token };
    setGatewayConfig(config);
    const result = await pingGateway();
    setLatency(result.latencyMs);
    setStatus(result.ok ? 'connected' : 'failed');
  }

  function handleSave() {
    setGatewayConfig({ url, token });
    testConnection(url, token);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="h-5 w-5 text-orange-DEFAULT" />
        <h3 className="text-sm font-semibold text-white/80">Gateway Connection</h3>
        <div className="flex-1" />
        {status === 'connected' && (
          <div className="flex items-center gap-1.5 text-[10px] text-green-400">
            <CheckCircle2 className="h-3 w-3" /> Connected ({latency}ms)
          </div>
        )}
        {status === 'failed' && (
          <div className="flex items-center gap-1.5 text-[10px] text-red-400">
            <AlertCircle className="h-3 w-3" /> Unreachable
          </div>
        )}
        {status === 'testing' && (
          <div className="flex items-center gap-1.5 text-[10px] text-white/30">
            <Wifi className="h-3 w-3 animate-pulse" /> Testing...
          </div>
        )}
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-white/30 mb-1 block">Gateway URL</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white/70 font-mono outline-none focus:border-white/[0.15] transition"
          placeholder="http://localhost:18789"
        />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-white/30 mb-1 block">Auth Token</label>
        <div className="relative">
          <input
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 pr-8 text-xs text-white/70 font-mono outline-none focus:border-white/[0.15] transition"
            placeholder="Enter gateway token"
          />
          <button
            onClick={() => setShowToken(!showToken)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition"
          >
            {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 py-2 rounded-lg text-xs font-medium bg-[#e8721a]/20 text-[#e8721a] hover:bg-[#e8721a]/30 transition"
        >
          Save & Test
        </button>
        <button
          onClick={() => testConnection()}
          className="px-4 py-2 rounded-lg text-xs text-white/30 border border-white/[0.06] hover:bg-white/[0.03] transition"
        >
          Test
        </button>
      </div>

      {status === 'failed' && (
        <div className="text-[10px] text-white/20 leading-relaxed">
          Make sure the OpenClaw gateway is running on your machine.
          The Command Center connects directly to your local gateway for real-time chat with agents.
        </div>
      )}
    </div>
  );
}
