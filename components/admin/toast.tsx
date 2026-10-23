"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { snappy } from "@/lib/motion";

type Toast = { id: number; tone: "success" | "error"; text: string };
const ToastContext = createContext<(tone: Toast["tone"], text: string) => void>(() => {});

/** Transient confirmation of completed actions ("Match saved"). Errors that need fixing stay inline. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((tone: Toast["tone"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "error" ? 7000 : 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              transition={snappy}
              className={`pointer-events-auto flex items-start gap-3 border bg-graphite px-4 py-3 text-sm shadow-[0_12px_40px_rgb(0_0_0/0.4)] ${
                t.tone === "error" ? "border-[#5c2a33]" : "border-line"
              }`}
            >
              {t.tone === "success" ? (
                <CheckCircleIcon size={18} weight="fill" className="mt-px shrink-0 text-violet" aria-hidden />
              ) : (
                <WarningCircleIcon size={18} weight="fill" className="mt-px shrink-0 text-[#ff9aa6]" aria-hidden />
              )}
              <span>{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
