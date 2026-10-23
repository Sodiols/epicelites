"use client";

import { motion } from "motion/react";
import { SplitReveal } from "@/components/ui/split-reveal";
import { CURTAIN_DELAY, easeOutExpo } from "@/lib/motion";

/**
 * Header for inner pages: the title assembles itself as the route curtain lifts,
 * a violet rule draws across underneath, and the summary follows.
 */
export function PageIntro({
  title,
  summary,
  aside,
}: {
  title: string;
  summary: string;
  aside?: React.ReactNode;
}) {
  return (
    <header className="mx-auto max-w-[1400px] px-4 pt-32 sm:px-8 md:pt-40">
      <SplitReveal
        as="h1"
        trigger="mount"
        delay={CURTAIN_DELAY}
        lines={[title]}
        className="font-display text-[clamp(4.5rem,15vw,13rem)] leading-[0.8]"
      />
      <motion.div
        aria-hidden
        className="mt-8 h-px origin-left bg-line"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, ease: easeOutExpo, delay: CURTAIN_DELAY + 0.2 }}
      >
        <motion.div
          className="h-px w-24 origin-left bg-violet"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, ease: easeOutExpo, delay: CURTAIN_DELAY + 0.6 }}
        />
      </motion.div>
      <motion.div
        className="mt-6 flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: easeOutExpo, delay: CURTAIN_DELAY + 0.45 }}
      >
        <p className="max-w-[46ch] text-lg text-smoke">{summary}</p>
        {aside}
      </motion.div>
    </header>
  );
}
