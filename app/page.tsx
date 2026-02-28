'use client';

import { AuthProvider, useAuth } from '@/lib/auth';
import AppShell from '@/components/command-center/AppShell';
import LoginPage from '@/components/command-center/LoginPage';

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-space">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon/20 border-t-neon" />
          <span className="font-mono text-[10px] text-white/20">Initializing...</span>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;
  return <AppShell />;
}

export default function Home() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}