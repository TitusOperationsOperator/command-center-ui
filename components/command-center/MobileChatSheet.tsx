'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import ChatPane from './ChatPane';
import type { AgentId } from './types';

interface MobileChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeAgent: AgentId;
  onSelectAgent: (agent: AgentId) => void;
  activeThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
}

export default function MobileChatSheet({
  open,
  onOpenChange,
  activeAgent,
  onSelectAgent,
  activeThreadId,
  onSelectThread,
}: MobileChatSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-neon/25 bg-space-card/90 shadow-lg backdrop-blur-xl lg:hidden"
          style={{ boxShadow: '0 0 20px rgba(0, 255, 65, 0.15)' }}
        >
          <MessageCircle className="h-5 w-5 text-neon/80" />
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 font-mono text-[9px] font-bold text-space">
            3
          </span>
        </motion.button>
      </DrawerTrigger>
      <DrawerContent className="h-[85vh] border-white/[0.08] bg-space-card/95 backdrop-blur-2xl">
        <DrawerTitle className="sr-only">Agent Chat</DrawerTitle>
        <div className="flex-1 overflow-hidden">
          <ChatPane
            activeAgent={activeAgent}
            onSelectAgent={onSelectAgent}
            activeThreadId={activeThreadId}
            onSelectThread={onSelectThread}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
