"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

/** Fires one Analytics event when the page it is on is shown. */
export function TrackEvent({ name, params }: { name: string; params?: Record<string, unknown> }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    // Marked as sent only when it actually fires, so a cancelled timer (React runs effects
    // twice in development) never swallows the event.
    const t = setTimeout(() => {
      sent.current = true;
      trackEvent(name, params);
    }, 50);
    return () => clearTimeout(t);
  }, [name, params]);
  return null;
}
