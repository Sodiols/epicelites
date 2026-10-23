"use client";

import Link from "next/link";

export default function ConsoleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid max-w-xl gap-4 py-10">
      <h1 className="font-display text-4xl leading-none">Something went wrong</h1>
      <p className="text-sm text-smoke">
        This page could not load its data. Your last saved changes are safe. Try again, or go back to the dashboard.
      </p>
      {error.digest && <p className="font-mono text-xs text-smoke">Reference: {error.digest}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={reset} className="a-btn a-btn-primary">
          Try again
        </button>
        <Link href="/EEAUTHOR/dashboard" className="a-btn a-btn-secondary">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
