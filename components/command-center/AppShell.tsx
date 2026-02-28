'use client';

import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, DollarSign, FileText, Folder, Activity, Upload, Server, Shield, Coins, Zap, Clock, Terminal, Settings as SettingsIcon } from 'lucide-react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import ChromeTabs from './ChromeTabs';
import ContextMenuProvider from './ContextMenuProvider';
import CommandPalette from './CommandPalette';
import NotificationBell from './NotificationBell';
import ToastProvider from './Toast';
import CommandBar from './CommandBar';
import ChatPane from './ChatPane';
import MobileChatSheet from './MobileChatSheet';
import DashboardView from './views/DashboardView';
import MemoryView from './views/MemoryView';
import FinOpsView from './views/FinOpsView';
import MemoryFileView from './views/MemoryFileView';
import ProjectsView from './views/ProjectsView';
import ActivityView from './views/ActivityView';
import FilesView from './views/FilesView';
import SystemView from './views/SystemView';
import AgentDetailView from './views/AgentDetailView';
import CronView from './views/CronView';
import LogsView from './views/LogsView';
import SettingsView from './views/SettingsView';
import type { AgentId, TabItem } from './types';

const PINNED_TABS: TabItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, pinned: true },
  { id: 'agent-titus', label: 'Titus âš¡', icon: Shield, pinned: true, type: 'agent', data: { agentId: 'titus' } },
  { id: 'agent-looty', label: 'Looty ðŸª™', icon: Coins, pinned: true, type: 'agent', data: { agentId: 'looty' } },
  { id: 'agent-minibolt', label: 'Mini Bolt ðŸ”©', icon: Zap, pinned: true, type: 'agent', data: { agentId: 'minibolt' } },
  { id: 'projects', label: 'Projects', icon: Folder, pinned: true },
  { id: 'activity', label: 'Activity', icon: Activity, pinned: true },
  { id: 'memory', label: 'Memory', icon: FileText, pinned: true },
  { id: 'files', label: 'Files', icon: Upload, pinned: true },
  { id: 'system', label: 'System', icon: Server, pinned: true },
  { id: 'cron', label: 'Cron', icon: Clock, pinned: true },
  { id: 'logs', label: 'Logs', icon: Terminal, pinned: true },
  { id: 'finops', label: 'FinOps', icon: DollarSign, pinned: true },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, pinned: true },
];

export default function AppShell() {
  const [activeAgent, setActiveAgent] = useState<AgentId>('titus');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [tabs, setTabs] = useState<TabItem[]>(PINNED_TABS);
  const [activeTabId, setActiveTabId] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);

  // Keyboard shortcuts: Alt+1-9 for tabs, Alt+0 for last tab
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (idx < tabs.length) setActiveTabId(tabs[idx].id);
      }
      if (e.altKey && e.key === '0') {
        e.preventDefault();
        setActiveTabId(tabs[tabs.length - 1].id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tabs]);

  const handleSelectAgent = useCallback((agent: AgentId) => {
    setActiveAgent(agent);
  }, []);

  const handleSelectThread = useCallback((threadId: string | null) => {
    setActiveThreadId(threadId);
  }, []);

  const openTab = useCallback(
    (tab: Omit<TabItem, 'pinned'>) => {
      setTabs((prev) => {
        const existing = prev.find((t) => t.id === tab.id);
        if (existing) return prev;
        return [...prev, { ...tab, pinned: false }];
      });
      setActiveTabId(tab.id);
    },
    []
  );

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const tab = prev.find((t) => t.id === tabId);
        if (!tab || tab.pinned) return prev;
        const filtered = prev.filter((t) => t.id !== tabId);
        if (activeTabId === tabId) {
          const idx = prev.findIndex((t) => t.id === tabId);
          const next = filtered[Math.min(idx, filtered.length - 1)];
          if (next) setActiveTabId(next.id);
        }
        return filtered;
      });
    },
    [activeTabId]
  );

  const renderMainStage = () => {
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return <DashboardView />;

    // Agent detail tabs
    if (tab.type === 'agent' && tab.data?.agentId) {
      return <AgentDetailView agentId={tab.data.agentId} />;
    }

    switch (tab.id) {
      case 'dashboard':
        return <DashboardView />;
      case 'finops':
        return <FinOpsView />;
      case 'memory':
        return <MemoryView onOpenFile={openTab} />;
      case 'projects':
        return <ProjectsView />;
      case 'activity':
        return <ActivityView />;
      case 'files':
        return <FilesView />;
      case 'system':
        return <SystemView />;
      case 'cron':
        return <CronView />;
      case 'logs':
        return <LogsView />;
      case 'settings':
        return <SettingsView />;
      default:
        if (tab.type === 'memory-file') {
          return (
            <MemoryFileView
              fileId={tab.data?.fileId}
              filename={tab.data?.filename}
            />
          );
        }
        return <DashboardView />;
    }
  };

  return (
    <ToastProvider>
    <ContextMenuProvider>
    <div className="flex h-screen w-full flex-col overflow-hidden bg-space">
      <div className="absolute inset-0 bg-gradient-radial from-neon/[0.015] via-transparent to-transparent pointer-events-none" />

      <div className="relative flex flex-1 overflow-hidden">
        <div className="hidden lg:flex h-full w-full">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel
              defaultSize={22}
              minSize={15}
              maxSize={35}
              className="min-w-0"
            >
              <ChatPane
                activeAgent={activeAgent}
                onSelectAgent={handleSelectAgent}
                activeThreadId={activeThreadId}
                onSelectThread={handleSelectThread}
              />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={78} className="min-w-0">
              <div className="flex h-full flex-col">
                <ChromeTabs
                  tabs={tabs}
                  activeTabId={activeTabId}
                  onTabChange={setActiveTabId}
                  onCloseTab={closeTab}
                />
                <CommandBar />
                <main className="flex-1 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTabId}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                      className="h-full overflow-y-auto scrollbar-thin"
                    >
                      {renderMainStage()}
                    </motion.div>
                  </AnimatePresence>
                </main>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <div className="flex flex-1 flex-col lg:hidden">
          <ChromeTabs
            tabs={tabs}
            activeTabId={activeTabId}
            onTabChange={setActiveTabId}
            onCloseTab={closeTab}
          />
          <CommandBar />
          <main className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTabId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                className="h-full overflow-y-auto scrollbar-thin"
              >
                {renderMainStage()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <MobileChatSheet
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        activeAgent={activeAgent}
        onSelectAgent={handleSelectAgent}
        activeThreadId={activeThreadId}
        onSelectThread={handleSelectThread}
      />
    </div>
    <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} onNavigate={(tab) => { setActiveTabId(tab); setCmdkOpen(false); }} />
    </ContextMenuProvider>
    </ToastProvider>
  );
}
