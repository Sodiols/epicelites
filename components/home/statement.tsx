"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowRightIcon } from "@phosphor-icons/react";

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  const y = useTransform(progress, range, [8, 0]);
  return (
    <motion.span style={{ opacity, y }} className="inline-block">
      {word}&nbsp;
    </motion.span>
  );
}

/**
 * The team statement reads itself in as it scrolls through the viewport:
 * each word lights up in order, tied directly to scroll position, so the
 * visitor sets the reading pace. The crest turns a quarter as it goes.
 */
export function Statement({ text, logoUrl }: { text: string; logoUrl: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-25, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.7, 1]);
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <section aria-label="About the team" className="relative px-4 py-28 sm:px-8 md:py-40">
      <div ref={ref} className="mx-auto grid max-w-[1400px] gap-10 md:grid-cols-12">
        <motion.div style={{ rotate, scale }} className="md:col-span-2 md:pt-3">
          <Image src={logoUrl} alt="Epic Elites crest" width={96} height={68} className="h-[68px] w-24 object-contain" />
        </motion.div>
        <div className="md:col-span-10">
          <p className="text-[clamp(1.75rem,3.6vw,3.25rem)] leading-[1.12] font-medium tracking-tight">
            {words.map((w, i) => (
              <Word
                key={i}
                word={w}
                progress={scrollYProgress}
                range={[i / words.length, (i + 1) / words.length]}
              />
            ))}
          </p>
          <Link
            href="/about"
            className="link-underline group mt-10 inline-flex items-center gap-2 pb-1 font-semibold text-violet"
          >
            About the team
            <ArrowRightIcon
              size={16}
              aria-hidden
              className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
