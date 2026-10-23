"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { easeOutExpo } from "@/lib/motion";

type Props = {
  /** Lines of text; each line is masked separately so glyphs rise out of their own baseline. */
  lines: string[];
  as?: "h1" | "h2" | "p" | "span";
  id?: string;
  className?: string;
  lineClassName?: string[];
  /** Seconds before the first glyph moves. */
  delay?: number;
  /** "mount" plays immediately (page intros); "view" waits until scrolled into view. */
  trigger?: "mount" | "view";
};

/**
 * Display text that assembles itself: every character rises through a clipping mask
 * on a staggered spring-like curve, line by line. Screen readers get the plain string.
 */
export function SplitReveal({
  lines,
  as = "h2",
  id,
  className,
  lineClassName,
  delay = 0,
  trigger = "view",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  const play = trigger === "mount" || inView;
  const Tag = motion[as];
  let index = 0;

  return (
    <Tag ref={ref as never} id={id} className={className}>
      <span className="sr-only">{lines.join(" ")}</span>
      {lines.map((line, li) => (
        <span
          key={li}
          aria-hidden
          className={`block overflow-hidden pb-[0.06em] ${lineClassName?.[li] ?? ""}`}
        >
          {line.split(" ").map((word, wi, words) => (
            <span key={wi} className="inline-block whitespace-nowrap">
              {[...word].map((ch) => {
                const i = index++;
                return (
                  <motion.span
                    key={i}
                    className="inline-block will-change-transform"
                    initial={reduce ? false : { y: "105%", rotate: 6 }}
                    animate={play ? { y: "0%", rotate: 0 } : undefined}
                    transition={{ duration: 0.9, ease: easeOutExpo, delay: delay + i * 0.028 }}
                  >
                    {ch}
                  </motion.span>
                );
              })}
              {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}
