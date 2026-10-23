"use client";

import Image from "next/image";
import { Fragment, useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from "motion/react";

const PHRASES = ["Rise above", "Epic Elites", "Free Fire", "Rise above", "Epic Elites", "Free Fire"];

/**
 * The page's only marquee. It drifts on its own, but scroll velocity feeds into it:
 * scroll faster and it accelerates and leans into the motion; scroll up and it reverses.
 */
export function VelocityMarquee({ logoUrl }: { logoUrl: string }) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(velocity, [-2000, 0, 2000], [-5, 0, 5], { clamp: false });
  const skewX = useTransform(velocity, [-2500, 2500], [12, -12]);
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const b = boost.get();
    if (b < 0) direction.current = -1;
    else if (b > 0) direction.current = 1;
    const move = direction.current * -2.2 * (delta / 1000) * (1 + Math.abs(b));
    baseX.set(baseX.get() + move);
  });

  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);

  const row = (
    <div className="flex shrink-0 items-center">
      {PHRASES.map((p, i) => (
        <Fragment key={i}>
          <span className="font-display px-6 text-[clamp(3.5rem,9vw,8rem)] leading-none">{p}</span>
          <Image src={logoUrl} alt="" width={64} height={45} className="h-auto w-[clamp(2.5rem,5vw,4rem)] object-contain" />
        </Fragment>
      ))}
    </div>
  );

  return (
    <div aria-hidden className="overflow-hidden border-y border-line bg-carbon py-6">
      <motion.div className="flex w-max will-change-transform" style={{ x, skewX }}>
        {row}
        {row}
      </motion.div>
    </div>
  );
}
