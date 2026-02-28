'use client';

import { useContextMenu } from './ContextMenuProvider';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { TabItem } from './types';

interface ChromeTabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

// Agent-specific colors for tab indicators
const TAB_COLORS: Record<string, string> = {
  'agent-titus': '#3b82f6',
  'agent-looty': '#ffd700',
  'agent-minibolt': '#22c55e',
};
const DEFAULT_TAB_COLOR = '#e8721a'; // burnt orange

export default function ChromeTabs({
  tabs,
  activeTabId,
  onTabChange,
  onCloseTab,
}: ChromeTabsProps) {
  const { show: showCtx } = useContextMenu();
  const { toast } = useToast();

  const activeColor = TAB_COLORS[activeTabId] || DEFAULT_TAB_COLOR;

  return (
    <div className="flex h-10 items-end gap-0.5 bg-space px-2 pt-1.5 overflow-x-auto scrollbar-thin">
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        const Icon = tab.icon;
        const tabColor = TAB_COLORS[tab.id] || DEFAULT_TAB_COLOR;
        return (
          <div
            key={tab.id}
            className={`group relative flex items-center gap-1.5 rounded-t-lg px-3 sm:px-4 py-1.5 text-[11px] transition-all flex-shrink-0 cursor-pointer ${
              isActive
                ? 'bg-space-card text-white/90 z-10'
                : 'text-white/35 hover:text-white/55 hover:bg-white/[0.03]'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            <div className="relative">
              <Icon
                className="h-3 w-3 flex-shrink-0"
                style={isActive && TAB_COLORS[tab.id] ? { color: tabColor } : undefined}
              />
              {tab.badge !== undefined && tab.badge > 0 && (
                <div className="absolute -top-1 -right-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#e8740c] px-1 text-[9px] font-medium text-white">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </div>
              )}
            </div>
            <span className="hidden xs:inline sm:inline max-w-[120px] truncate">
              {tab.label}
            </span>

            {!tab.pinned && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className={`ml-0.5 flex h-4 w-4 items-center justify-center rounded-sm transition-all ${
                  isActive
                    ? 'text-white/30 hover:bg-white/[0.1] hover:text-white/70'
                    : 'opacity-0 group-hover:opacity-100 text-white/20 hover:bg-white/[0.1] hover:text-white/60'
                }`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}

            {isActive && (
              <motion.div
                layoutId="chrome-tab-indicator"
                className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                style={{
                  backgroundColor: tabColor + '90',
                  boxShadow: `0 0 8px ${tabColor}60`,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </div>
        );
      })}

      <div className="flex-1" />
    </div>
  );
}
