'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuItem {
  label: string;
  icon?: string;
  action: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface ContextMenuState {
  x: number;
  y: number;
  items: MenuItem[];
}

const Ctx = createContext<{
  show: (x: number, y: number, items: MenuItem[]) => void;
}>({ show: () => {} });

export const useContextMenu = () => useContext(Ctx);

export default function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const show = useCallback((x: number, y: number, items: MenuItem[]) => {
    const clampX = Math.min(x, window.innerWidth - 220);
    const clampY = Math.min(y, window.innerHeight - items.length * 34 - 20);
    setMenu({ x: clampX, y: clampY, items });
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', close);
      document.addEventListener('contextmenu', close);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', close);
      document.removeEventListener('contextmenu', close);
    };
  }, [menu]);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <AnimatePresence>
        {menu && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12, ease: [0.2, 0, 0, 1] }}
            className="fixed z-[9999] min-w-[200px] rounded-xl border border-white/[0.08] bg-[#12122a]/95 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-1.5"
            style={{ left: menu.x, top: menu.y }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {menu.items.map((item, i) => {
              if (item.divider) return <div key={i} className="my-1 h-px bg-white/[0.06] mx-2" />;
              return (
                <button
                  key={i}
                  onClick={() => { item.action(); setMenu(null); }}
                  disabled={item.disabled}
                  className={[
                    'w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[11px] transition-all rounded-md mx-0.5',
                    item.danger
                      ? 'text-red-400/80 hover:bg-red-500/[0.12] hover:text-red-300'
                      : 'text-white/60 hover:bg-white/[0.06] hover:text-white/90',
                    item.disabled ? 'opacity-40 cursor-default' : 'cursor-pointer',
                  ].join(' ')}
                >
                  {item.icon && <span className="w-4 text-center text-[12px]">{item.icon}</span>}
                  <span className="flex-1">{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}