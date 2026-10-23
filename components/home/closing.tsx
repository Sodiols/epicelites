"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { Magnetic } from "@/components/ui/magnetic";

/**
 * "Rise above" fills from the bottom up as it scrolls through the viewport,
 * like a bar charging, while the two words slide in from opposite sides.
 */
export function Closing() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center 0.55"] });
  const fill = useTransform(scrollYProgress, [0.15, 1], ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"]);
  const leftX = useTransform(scrollYProgress, [0, 1], ["-18%", "0%"]);
  const rightX = useTransform(scrollYProgress, [0, 1], ["18%", "0%"]);

  const Word = ({ text, x, align }: { text: string; x: typeof leftX; align: string }) => (
    <motion.span style={{ x }} className={`relative block ${align}`}>
      <span className="text-graphite">{text}</span>
      <motion.span aria-hidden className="absolute inset-0 text-violet" style={{ clipPath: fill }}>
        {text}
      </motion.span>
    </motion.span>
  );

  return (
    <section ref={ref} aria-labelledby="closing-title" className="overflow-hidden px-4 pt-16 pb-8 sm:px-8">
      <div className="mx-auto max-w-[1400px]">
        <h2 id="closing-title" className="font-display text-[clamp(5rem,21vw,20rem)] leading-[0.8]">
          <span className="sr-only">Rise above</span>
          <span aria-hidden>
            <Word text="Rise" x={leftX} align="text-left" />
            <Word text="Above" x={rightX} align="text-right" />
          </span>
        </h2>
        <div className="mt-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <p className="max-w-[36ch] text-lg text-smoke">
            Tournament invitations, partnerships and media requests all start with a message.
          </p>
          <Magnetic>
            <Link href="/contact" className="btn btn-primary group">
              Contact the team
              <ArrowRightIcon
                size={16}
                weight="bold"
                aria-hidden
                className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
              />
            </Link>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
