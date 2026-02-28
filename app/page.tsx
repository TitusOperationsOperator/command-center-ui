'use client';

import { AuthProvider, useAuth } from '@/lib/auth';
import AppShell from '@/components/command-center/AppShell';
import LoginPage from '@/components/command-center/LoginPage';
import { useEffect, useState } from 'react';

function AuthGate() {
  const { user, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const info = `UA: ${navigator.userAgent.substring(0,50)}... | Screen: ${window.innerWidth}x${window.innerHeight}`;
    setDebugInfo(info);
    console.log('[Mobile Debug]', info, { user, loading });
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-space">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon/20 border-t-neon" />
          <span className="font-mono text-[10px] text-white/20">Initializing...</span>
          <span className="font-mono text-[8px] text-white/10 mt-2 max-w-xs text-center">{debugInfo}</span>
        </div>
      </div>
    );
  }

  // Temporary: bypass auth for debugging
  return <AppShell />;
  
  // if (!user) return <LoginPage />;
  // return <AppShell />;
}

export default function Home() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}