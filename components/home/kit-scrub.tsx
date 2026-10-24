"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { easeOutExpo } from "@/lib/motion";

const STEPS = [
  {
    title: "Crest up front",
    body: "The winged EE crest over the heart, the monogram opposite, and Rise Above running down the side panel.",
  },
  {
    title: "Name on the back",
    body: "Every player's tag and number across the shoulders, framed by the same angular violet panels.",
  },
];

/**
 * The kit turns as you scroll. The section pins, and scroll position drives the jersey
 * through a full half-turn from front to back with real 3D depth, while the copy on the
 * left swaps to describe whichever side is facing you.
 */
export function KitScrub({ front, back }: { front: string; back: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 24, mass: 0.5 });

  const rotateY = useTransform(p, [0.15, 0.75], [-14, 194]);
  const rotateX = useTransform(p, [0, 0.45, 1], [6, -4, 4]);
  const scale = useTransform(p, [0, 0.45, 1], [0.92, 1.02, 0.96]);
  // A moving sheen sells the fabric as the garment turns through the light.
  const sheenX = useTransform(p, [0.15, 0.75], ["-60%", "160%"]);
  const progressLine = useTransform(p, [0.1, 0.85], [0, 1]);

  const [step, setStep] = useState(0);
  useMotionValueEvent(rotateY, "change", (v) => setStep(v > 90 ? 1 : 0));

  return (
    <section ref={ref} aria-labelledby="kit-title" className="relative h-[260dvh]">
      <div className="sticky top-0 flex h-[100dvh] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1400px] items-center gap-8 px-4 sm:px-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="font-wide text-[0.6875rem] text-violet">The kit</p>
            <h2 id="kit-title" className="font-display mt-4 text-[clamp(3rem,6.5vw,6rem)] leading-[0.86]">
              Wear the identity
            </h2>

            <div className="mt-6 flex gap-5 md:mt-8">
              <div className="relative w-px shrink-0 bg-line">
                <motion.div className="absolute inset-0 origin-top bg-violet" style={{ scaleY: progressLine }} />
              </div>
              <div className="relative min-h-[8.5rem] flex-1 overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={step}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    exit={{ y: "-60%", opacity: 0 }}
                    transition={{ duration: 0.6, ease: easeOutExpo }}
                  >
                    <h3 className="text-2xl font-semibold">{STEPS[step].title}</h3>
                    <p className="mt-3 max-w-[38ch] text-smoke">{STEPS[step].body}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <Link href="/media" className="btn btn-primary group mt-8">
              See the kit
              <ArrowRightIcon
                size={16}
                weight="bold"
                aria-hidden
                className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="order-first flex justify-center [perspective:1400px] md:order-none md:col-span-7">
            <motion.div
              className="relative aspect-[1000/1106] h-[36dvh] md:h-[min(68dvh,40rem)] [transform-style:preserve-3d]"
              style={{ rotateY, rotateX, scale }}
            >
              {[
                { src: front, alt: "Front of the Epic Elites jersey", back: false },
                { src: back, alt: "Back of the Epic Elites jersey", back: true },
              ].map((face) => (
                <div
                  key={face.src}
                  className="chamfer absolute inset-0 overflow-hidden [--cut:28px] [backface-visibility:hidden]"
                  style={{ transform: face.back ? "rotateY(180deg)" : undefined }}
                >
                  <Image src={face.src} alt={face.alt} fill sizes="(min-width: 768px) 40vw, 80vw" className="object-cover" />
                  <motion.span
                    aria-hidden
                    className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    style={{ x: sheenX }}
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
