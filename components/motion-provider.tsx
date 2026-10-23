"use client";

import { MotionConfig } from "motion/react";

/** Every Motion animation on the site collapses to its end state when the visitor asks for reduced motion. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
