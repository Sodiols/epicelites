"use client";

import { motion } from "motion/react";
import { easeOutExpo } from "@/lib/motion";

/**
 * Horizontal bars for a small categorical breakdown (matches by status). Each bar grows
 * from zero on first paint and re-animates when the numbers change, so a change in the
 * schedule is visible as movement. Counts are printed, so no value depends on bar length.
 */
export function StatusBars({ rows }: { rows: { label: string; value: number; tone: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <dl className="grid gap-3">
      {rows.map((r, i) => (
        <div key={r.label} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3 text-sm">
          <dt className="text-smoke">{r.label}</dt>
          <dd className="h-2 bg-transparent" aria-hidden>
            <motion.span
              className={`block h-full origin-left ${r.tone}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: r.value / max }}
              transition={{ duration: 0.9, ease: easeOutExpo, delay: i * 0.05 }}
            />
          </dd>
          <dd className="text-right font-mono tabular-nums">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
