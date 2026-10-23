"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { PlayerCard } from "@/components/roster/player-card";
import { SplitReveal } from "@/components/ui/split-reveal";
import { pad } from "@/lib/team";
import type { Player } from "@/lib/data/public";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Desktop: the section pins and vertical scroll pans the lineup sideways, card by card,
 * with a progress rail that fills as you move through the six players.
 * Below 1024px it becomes a native swipeable scroll-snap row (no scroll hijacking on touch).
 */
export function RosterPan({ players }: { players: Player[] }) {
  const wrapRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [distance, setDistance] = useState(0);
  const [desktop, setDesktop] = useState(false);
  const pan = useRef({ desktop: false, distance: 0 });

  useIsoLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const measure = () => {
      const isDesk = mq.matches && !reduce;
      const d = trackRef.current ? Math.max(0, trackRef.current.scrollWidth - window.innerWidth) : 0;
      pan.current = { desktop: isDesk, distance: d };
      setDesktop(isDesk);
      setDistance(d);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    mq.addEventListener("change", measure);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", measure);
      window.removeEventListener("resize", measure);
    };
  }, [reduce]);

  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  const x = useTransform(smooth, (v) => (pan.current.desktop ? -v * pan.current.distance : 0));
  const rail = useTransform(smooth, [0, 1], [0, 1]);

  return (
    <section
      ref={wrapRef}
      aria-labelledby="lineup-title"
      className="relative"
      style={{ height: desktop ? `calc(100dvh + ${distance}px)` : undefined }}
    >
      <div className={desktop ? "sticky top-0 flex h-[100dvh] flex-col justify-center overflow-hidden" : "py-24"}>
        <div className="mx-auto flex w-full max-w-[1400px] items-end justify-between gap-6 px-4 sm:px-8">
          <SplitReveal
            id="lineup-title"
            lines={["The lineup"]}
            className="font-display text-[clamp(3.5rem,8vw,7.5rem)] leading-[0.85]"
          />
          <Link href="/roster" className="btn btn-ghost hidden shrink-0 sm:inline-flex">
            Full roster
            <ArrowRightIcon size={16} aria-hidden />
          </Link>
        </div>

        <motion.div
          ref={trackRef}
          style={{ x }}
          className={`mt-10 flex gap-5 px-4 sm:px-8 lg:mt-14 lg:gap-8 lg:pr-[12vw] lg:pl-[max(2rem,calc((100vw-1400px)/2+2rem))] ${
            desktop ? "w-max" : "snap-x snap-mandatory overflow-x-auto pb-4 [scrollbar-width:none]"
          }`}
        >
          {players.map((p, i) => (
            <PlayerCard
              key={p.id}
              player={p}
              index={i}
              href={`/roster?player=${p.slug}`}
              sizes="(min-width: 1024px) 26vw, 75vw"
              className="w-[75vw] shrink-0 snap-start sm:w-[44vw] lg:w-[min(26vw,24rem)]"
            />
          ))}
        </motion.div>

        {desktop && (
          <div className="mx-auto mt-10 flex w-full max-w-[1400px] items-center gap-6 px-8">
            <div className="relative h-px flex-1 bg-line">
              <motion.div className="absolute inset-0 origin-left bg-violet" style={{ scaleX: rail }} />
            </div>
            <span className="font-mono text-xs text-smoke tabular-nums">
              {pad(players.length)} players
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
