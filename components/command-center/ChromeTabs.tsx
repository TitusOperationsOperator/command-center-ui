'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { TabItem } from './types';

interface ChromeTabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

export default function ChromeTabs({
  tabs,
  activeTabId,
  onTabChange,
  onCloseTab,
}: ChromeTabsProps) {
  return (
    <div className="flex h-10 items-end gap-0.5 bg-space px-2 pt-1.5 overflow-x-auto scrollbar-thin">
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        const Icon = tab.icon;
        return (
          <div
            key={tab.id}
            className={`group relative flex items-center gap-1.5 rounded-t-lg px-3 sm:px-4 py-1.5 font-mono text-[11px] transition-all flex-shrink-0 cursor-pointer ${
              isActive
                ? 'bg-space-card text-white/90 z-10'
                : 'text-white/35 hover:text-white/55 hover:bg-white/[0.03]'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon className="h-3 w-3 flex-shrink-0" />
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
                className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-neon/60"
                style={{ boxShadow: '0 0 8px rgba(0, 255, 65, 0.4)' }}
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
