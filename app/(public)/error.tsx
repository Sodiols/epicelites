"use client";

import Link from "next/link";

/** Shown when live content cannot be loaded. It says so rather than showing stale data. */
export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto grid min-h-[70dvh] max-w-[1400px] content-center px-4 pt-32 sm:px-8">
      <p className="font-mono text-sm text-smoke">Content unavailable</p>
      <h1 className="font-display mt-4 text-[clamp(3rem,8vw,6rem)] leading-[0.86]">This page could not load</h1>
      <p className="mt-6 max-w-[44ch] text-lg text-smoke">
        The team&apos;s content service did not respond. Try again in a moment.
      </p>
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-ghost">
          Back to home
        </Link>
      </div>
    </main>
  );
}
