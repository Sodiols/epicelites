"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

/**
 * The full-width wordmark at the foot of every page. As the footer scrolls in,
 * the wordmark stretches out to full width and lifts into place,
 * so the page ends on the name rather than on a list of links.
 */
export function FooterWordmark({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], ["45%", "0%"]);
  const scaleX = useTransform(scrollYProgress, [0, 1], [0.86, 1]);

  return (
    <div ref={ref} aria-hidden className="overflow-hidden px-2 select-none">
      <motion.p
        style={{ y, scaleX }}
        className="font-display text-center text-[19.5vw] leading-[0.8] text-graphite"
      >
        {text}
      </motion.p>
    </div>
  );
}
