"use client";

import { ArrowUpIcon } from "@phosphor-icons/react";

export function BackToTop() {
  return (
    <button
      type="button"
      className="group inline-flex items-center gap-2 uppercase transition-colors hover:text-bone"
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
    >
      Back to top
      <ArrowUpIcon
        size={14}
        aria-hidden
        className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-1"
      />
    </button>
  );
}
