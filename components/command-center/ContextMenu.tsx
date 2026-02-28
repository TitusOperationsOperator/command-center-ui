'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  danger?: boolean;
  divider?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  children: React.ReactNode;
  className?: string;
}

export default function ContextMenu({ items, children, className }: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Position menu, clamping to viewport
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - items.length * 36 - 20);
    setPos({ x, y });
    setOpen(true);
  }, [items.length]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const closeKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', closeKey);
    document.addEventListener('contextmenu', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', closeKey);
      document.removeEventListener('contextmenu', close);
    };
  }, [open]);

  return (
    <>
      <div onContextMenu={handleContext} className={className}>
        {children}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-[9999] min-w-[180px] rounded-lg border border-white/[0.08] bg-[#1a1a2e]/95 backdrop-blur-xl shadow-2xl py-1"
            style={{ left: pos.x, top: pos.y }}
          >
            {items.map((item, i) => {
              if (item.divider) {
                return <div key={i} className="my-1 h-px bg-white/[0.06]" />;
              }
              return (
                <button
                  key={i}
                  onClick={() => { item.action(); setOpen(false); }}
                  disabled={item.disabled}
                  className={[
                    'w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[11px] transition-colors',
                    item.danger ? 'text-red-400/80 hover:bg-red-400/[0.08]' : 'text-white/60 hover:bg-white/[0.06] hover:text-white/80',
                    item.disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                >
                  {item.icon && <span className="w-4 h-4 flex items-center justify-center text-[13px]">{item.icon}</span>}
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}