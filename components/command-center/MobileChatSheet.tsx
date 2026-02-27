'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
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
    <>
      {/* FAB button - only visible on mobile */}
      <motion.button
        onClick={() => onOpenChange(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-neon/30 bg-space-card/90 backdrop-blur-xl shadow-lg shadow-neon/10 lg:hidden"
      >
        <MessageCircle className="h-6 w-6 text-neon" />
        <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-neon animate-pulse" />
      </motion.button>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[85vh] border-t border-white/[0.08] bg-space p-0"
        >
          <ChatPane
            activeAgent={activeAgent}
            onSelectAgent={onSelectAgent}
            activeThreadId={activeThreadId}
            onSelectThread={onSelectThread}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
