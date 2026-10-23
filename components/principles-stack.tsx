"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";

const PRINCIPLES = [
  {
    title: "Teamwork",
    body: "Calls are trusted, rotations are shared and nobody plays the zone alone.",
    tone: "bg-carbon",
  },
  {
    title: "Discipline",
    body: "Scrims, reviews and drills every week, whether there is a tournament on the calendar or not.",
    tone: "bg-graphite",
  },
  {
    title: "Ambition",
    body: "Every lobby is a chance to raise the standard we set in the last one.",
    tone: "bg-violet text-night",
  },
];

function Card({
  item,
  index,
  total,
  progress,
}: {
  item: (typeof PRINCIPLES)[number];
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  // Each card shrinks and tips back as the cards after it slide over the top.
  const start = index / total;
  const scale = useTransform(progress, [start, 1], [1, 1 - (total - index - 1) * 0.06]);
  const rotateX = useTransform(progress, [start, 1], [0, (total - index - 1) * 6]);
  const shade = useTransform(progress, [start, 1], [0, (total - index - 1) * 0.28]);
  const dim = item.tone.includes("text-night");

  return (
    <div className="sticky top-24 flex h-[78dvh] items-start justify-center md:top-28" style={{ paddingTop: `${index * 28}px` }}>
      <motion.article
        style={{ scale, rotateX, transformPerspective: 1200, transformOrigin: "50% 0%" }}
        className={`chamfer relative flex h-[62dvh] min-h-[22rem] w-full flex-col justify-end p-8 [--cut:36px] sm:p-12 ${item.tone}`}
      >
        <motion.span aria-hidden className="pointer-events-none absolute inset-0 bg-night" style={{ opacity: shade }} />
        <div className="relative">
          <h3 className="font-display text-[clamp(4rem,12vw,11rem)] leading-[0.8]">{item.title}</h3>
          <p className={`mt-6 max-w-[40ch] text-lg sm:text-xl ${dim ? "text-night/80" : "text-smoke"}`}>{item.body}</p>
        </div>
      </motion.article>
    </div>
  );
}

/**
 * The three things the team plays by, as a physical stack: each card pins near the top
 * of the viewport and the next one slides up over it, pushing the earlier cards back.
 */
export function PrinciplesStack() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <div ref={ref} className="relative">
      {PRINCIPLES.map((item, i) => (
        <Card key={item.title} item={item} index={i} total={PRINCIPLES.length} progress={scrollYProgress} />
      ))}
    </div>
  );
}
