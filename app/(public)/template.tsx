"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { easeInOutQuart, easeOutExpo } from "@/lib/motion";
import { useBrand } from "@/components/brand-provider";

/**
 * Route transition. Every navigation is covered by a violet panel that lifts away
 * with an angled leading edge (the same 45deg cut used across the UI), while the
 * page underneath rises into place. It runs on first load too, so it doubles as the intro.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const { logoUrl } = useBrand();

  return (
    <>
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-[calc(100dvh+14vw)] bg-violet"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - 14vw))" }}
          initial={{ y: "0%" }}
          animate={{ y: "-100%" }}
          transition={{ duration: 0.85, ease: easeInOutQuart, delay: 0.08 }}
        >
          <motion.div
            className="absolute top-[50dvh] left-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 1, rotate: 0 }}
            animate={{ scale: 0.6, rotate: -8 }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
          >
            <Image
              src={logoUrl}
              alt=""
              width={96}
              height={68}
              priority
              className="h-[68px] w-24 object-contain brightness-0"
            />
          </motion.div>
        </motion.div>
      )}
      <motion.div
        initial={reduce ? false : { y: 80 }}
        animate={{ y: 0 }}
        transition={{ duration: 1.1, ease: easeOutExpo, delay: 0.2 }}
      >
        {children}
      </motion.div>
    </>
  );
}
