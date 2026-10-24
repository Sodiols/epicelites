"use client";

import Script from "next/script";
import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_ID, trackEvent } from "@/lib/analytics";

/**
 * Sends a page_view for every navigation, including the first load. The site changes pages
 * without a full reload, so without this Analytics would only see the first page of a visit.
 */
function PageViews() {
  const pathname = usePathname();
  const search = useSearchParams();
  const last = useRef<string | null>(null);

  useEffect(() => {
    const path = `${pathname}${search.size ? `?${search.toString()}` : ""}`;
    if (path === last.current) return;
    // A short timer (not requestAnimationFrame, which never fires in background tabs) lets
    // document.title update to the new page first. The path is recorded only when the event
    // is actually sent, so a cancelled timer never swallows a page view.
    const t = setTimeout(() => {
      last.current = path;
      trackEvent("page_view", { page_path: path, page_location: window.location.href, page_title: document.title });
    }, 50);
    return () => clearTimeout(t);
  }, [pathname, search]);

  return null;
}

/** Google Analytics 4 for the public site. Renders nothing unless NEXT_PUBLIC_GA_ID is set. */
export function GoogleAnalytics() {
  if (!GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`} strategy="afterInteractive" />
      <Suspense>
        <PageViews />
      </Suspense>
    </>
  );
}
