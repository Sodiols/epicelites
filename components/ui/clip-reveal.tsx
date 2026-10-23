"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { easeOutExpo } from "@/lib/motion";

/**
 * Image reveal: the frame wipes open on a diagonal as it enters the viewport while the
 * picture inside settles from an overscaled crop, then keeps a gentle scroll parallax.
 */
export function ClipReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <motion.div
      ref={ref}
      className={`overflow-hidden ${className ?? ""}`}
      initial={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" }}
      whileInView={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1.3, ease: easeOutExpo }}
    >
      <motion.div
        className="relative h-full w-full"
        initial={{ scale: 1.25 }}
        whileInView={{ scale: 1.08 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.8, ease: easeOutExpo }}
        style={{ y }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
