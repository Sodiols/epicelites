"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { SplitReveal } from "@/components/ui/split-reveal";
import { Magnetic } from "@/components/ui/magnetic";
import { CURTAIN_DELAY, easeOutExpo } from "@/lib/motion";

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The safe zone. In Free Fire the playable circle shrinks and everything outside it
 * is lost to the storm. Here the zone sweeps in on load, then keeps closing around
 * the team crest as the visitor scrolls through the pinned hero.
 */
export function Hero({ subtitle }: { subtitle: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // 0 → 1 once on load: the storm sweeps in from beyond the screen edge to the opening zone.
  const intro = useMotionValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) return;
    const controls = animate(intro, 1, { duration: 1.8, ease: easeOutExpo, delay: CURTAIN_DELAY + 0.1 });
    return () => controls.stop();
  }, [intro, reduce]);

  // 0 → 1 while the hero is pinned: the zone closes.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const closing = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.6 });

  const radius = useTransform([intro, closing], ([i, c]: number[]) => mix(150, 44, i) * mix(1, 0.6, c));
  const zoneRadius = useMotionTemplate`${radius}vmin`;
  const ringScale = useTransform(radius, (r) => r / 44);
  const stormOpacity = useTransform(closing, [0, 1], [0.8, 0.95]);

  const textY = useTransform(closing, [0, 1], [0, -90]);
  const textOpacity = useTransform(closing, [0, 0.75], [1, 0]);
  // The crest shrinks with the zone so it always stays inside the ring.
  const crestScale = useTransform(closing, [0, 1], [1, 0.62]);

  // Pointer parallax: three depths moving at different rates, all on springs.
  const px = useSpring(0, { stiffness: 60, damping: 18 });
  const py = useSpring(0, { stiffness: 60, damping: 18 });
  const crestX = useTransform(px, (v) => v * -22);
  const crestY = useTransform(py, (v) => v * -10);
  const ringX = useTransform(px, (v) => v * 14);
  const ringY = useTransform(py, (v) => v * 10);

  const onPointerMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse") return;
    px.set(e.clientX / window.innerWidth - 0.5);
    py.set(e.clientY / window.innerHeight - 0.5);
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative h-[150dvh]"
      onPointerMove={onPointerMove}
    >
      <div className="sticky top-0 h-[100dvh] min-h-[38rem] overflow-hidden [--zx:50%] [--zy:74%] lg:[--zx:68%] lg:[--zy:54%]">
        {/* Inside the zone: a soft lift behind the crest. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at var(--zx) var(--zy), #221c33 0%, var(--color-night) 46vmin)",
          }}
        />

        {/* The storm: everything outside the current radius. */}
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-storm"
          style={{
            opacity: stormOpacity,
            backgroundImage:
              "repeating-linear-gradient(135deg, rgb(142 107 255 / 0.07) 0 1px, transparent 1px 12px)",
            ["--zr" as string]: zoneRadius,
            maskImage:
              "radial-gradient(circle at var(--zx) var(--zy), transparent var(--zr), #000 calc(var(--zr) + 1px))",
            WebkitMaskImage:
              "radial-gradient(circle at var(--zx) var(--zy), transparent var(--zr), #000 calc(var(--zr) + 1px))",
          }}
        />

        {/* The zone boundary. */}
        <motion.div
          aria-hidden
          className="absolute top-[var(--zy)] left-[var(--zx)] size-[88vmin] -translate-x-1/2 -translate-y-1/2"
          style={{ x: ringX, y: ringY }}
        >
          <motion.svg viewBox="0 0 200 200" className="size-full overflow-visible" style={{ scale: ringScale }}>
            <motion.circle
              cx="100"
              cy="100"
              r="99.5"
              fill="none"
              className="stroke-violet"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: reduce ? 1 : 0, rotate: -90 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, ease: easeOutExpo, delay: CURTAIN_DELAY + 0.15 }}
              style={{ transformOrigin: "center" }}
            />
            <motion.circle
              cx="100"
              cy="100"
              r="104"
              fill="none"
              className="stroke-violet"
              strokeOpacity="0.45"
              strokeDasharray="1 5"
              vectorEffect="non-scaling-stroke"
              style={{ transformOrigin: "center" }}
              animate={reduce ? undefined : { rotate: 360 }}
              transition={{ duration: 90, ease: "linear", repeat: Infinity }}
            />
          </motion.svg>
        </motion.div>

        {/* The crest, held inside the zone. Its wings unfold from the centre spine on load. */}
        <motion.div
          className="absolute top-[var(--zy)] left-[var(--zx)] w-[min(52vmin,34rem)] -translate-x-1/2 -translate-y-1/2"
          style={{ x: crestX, y: crestY, scale: crestScale }}
        >
          <motion.div
            initial={reduce ? false : { clipPath: "inset(0% 50% 0% 50%)", scale: 0.86, y: 24 }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)", scale: 1, y: 0 }}
            transition={{ duration: 1.4, ease: easeOutExpo, delay: CURTAIN_DELAY + 0.35 }}
          >
            <Image
              src="/images/epic-elites-mark.svg"
              alt="Epic Elites crest"
              width={2328}
              height={1640}
              priority
              unoptimized
              className="h-auto w-full"
            />
          </motion.div>
        </motion.div>

        <motion.div
          className="relative mx-auto flex h-full max-w-[1400px] flex-col px-4 pt-28 sm:px-8 lg:justify-center lg:pt-16"
          style={{ y: textY, opacity: textOpacity }}
        >
          <motion.p
            className="font-wide flex items-center gap-3 text-[0.6875rem] text-violet"
            initial={reduce ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: easeOutExpo, delay: CURTAIN_DELAY + 0.2 }}
          >
            Free Fire esports
          </motion.p>

          <SplitReveal
            as="h1"
            id="hero-title"
            trigger="mount"
            delay={CURTAIN_DELAY + 0.1}
            lines={["Epic", "Elites"]}
            className="font-display mt-5 text-[clamp(5rem,17vw,8rem)] leading-[0.82] lg:text-[clamp(8rem,13.5vw,13rem)]"
            lineClassName={["", "text-violet"]}
          />

          <motion.p
            className="mt-6 max-w-[30ch] text-lg leading-snug text-smoke lg:text-xl"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: easeOutExpo, delay: CURTAIN_DELAY + 0.6 }}
          >
            {subtitle}
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-3"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: easeOutExpo, delay: CURTAIN_DELAY + 0.72 }}
          >
            <Magnetic>
              <Link href="/roster" className="btn btn-primary group">
                Meet the roster
                <ArrowRightIcon
                  size={16}
                  weight="bold"
                  aria-hidden
                  className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
                />
              </Link>
            </Magnetic>
            <Link href="/matches" className="btn btn-ghost">
              Match center
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
