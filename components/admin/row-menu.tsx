"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DotsThreeIcon } from "@phosphor-icons/react";
import { snappy } from "@/lib/motion";

/**
 * Contextual menu for a table row. Opens on click, closes on Escape, outside click or
 * selection, and returns focus to its trigger. Items are passed as children.
 */
export function RowMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={trigger}
        type="button"
        className="a-btn a-btn-ghost a-btn-icon"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <DotsThreeIcon size={20} weight="bold" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={snappy}
            style={{ transformOrigin: "top right" }}
            className="absolute top-full right-0 z-30 mt-1 grid min-w-48 border border-line bg-graphite py-1 shadow-[0_16px_40px_rgb(0_0_0/0.45)] [&_.menu-item]:flex [&_.menu-item]:w-full [&_.menu-item]:items-center [&_.menu-item]:gap-2 [&_.menu-item]:px-3 [&_.menu-item]:py-2 [&_.menu-item]:text-left [&_.menu-item]:text-sm [&_.menu-item:hover]:bg-carbon [&_.menu-item.danger]:text-[#ff9aa6]"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
