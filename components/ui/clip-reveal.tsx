"use client";

import { motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { easeOutExpo } from "@/lib/motion";

/**
 * Image reveal: the frame wipes open on a diagonal as it enters the viewport while the
 * picture inside settles from an overscaled crop, then keeps a gentle scroll parallax.
 */
export function ClipReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // Observe the frame, not the clipped image: a fully closed clip has no intersection.
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <div
      ref={ref}
      className={`overflow-hidden ${className ?? ""}`}
    >
      <motion.div
        className="h-full w-full"
        initial={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" }}
        animate={{ clipPath: inView || reducedMotion
          ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
          : "polygon(0 0, 0 0, 0 100%, 0 100%)" }}
        transition={{ duration: reducedMotion ? 0 : 1.3, ease: easeOutExpo }}
      >
        <motion.div
          className="relative h-full w-full"
          initial={{ scale: 1.25 }}
          animate={{ scale: reducedMotion ? 1 : inView ? 1.08 : 1.25 }}
          transition={{ duration: reducedMotion ? 0 : 1.8, ease: easeOutExpo }}
          style={{ y: reducedMotion ? 0 : y }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
