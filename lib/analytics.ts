"use client";

/** Google Analytics 4 measurement ID (G-XXXXXXXXXX). Analytics stays off when it is not set. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __eeGaReady?: boolean;
  }
}

/**
 * Google's standard command queue. Commands pushed here before gtag.js has loaded are kept and
 * replayed in order once it arrives, so no page view is lost on a fresh page load.
 * gtag.js only recognises the special `arguments` object, hence the rest-params exception.
 */
function gtag(..._args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

/** Queues the init and config commands exactly once, before any event. */
export function ensureAnalytics(): boolean {
  if (!GA_ID || typeof window === "undefined") return false;
  if (!window.__eeGaReady) {
    window.__eeGaReady = true;
    window.gtag = gtag;
    gtag("js", new Date());
    // Page views are sent manually on every route change (see components/google-analytics.tsx).
    gtag("config", GA_ID, { send_page_view: false });
  }
  return true;
}

/** Sends a GA4 event; a no-op when Analytics is not configured (and in the admin area). */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (ensureAnalytics()) gtag("event", name, params);
}
