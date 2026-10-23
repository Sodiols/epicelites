"use client";

import Script from "next/script";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileHandle = { reset: () => void };

type Props = {
  siteKey: string;
  /** Names the protected surface; the server rejects tokens issued for any other action. */
  action: string;
  onToken?: (token: string | null) => void;
};

/**
 * Cloudflare Turnstile, rendered explicitly so it works after client-side navigation and
 * can be reset: tokens are single-use, so the form calls reset() after every submission.
 * Turnstile adds a hidden "cf-turnstile-response" input inside the form it is placed in.
 */
export const Turnstile = forwardRef<TurnstileHandle, Props>(function Turnstile({ siteKey, action, onToken }, ref) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(() => typeof window !== "undefined" && Boolean(window.turnstile));
  const [failed, setFailed] = useState(false);
  const tokenCallback = useRef(onToken);
  tokenCallback.current = onToken;

  const render = useCallback(() => {
    if (!container.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(container.current, {
      sitekey: siteKey,
      action,
      theme: "dark",
      size: "flexible",
      callback: (token: string) => {
        setFailed(false);
        tokenCallback.current?.(token);
      },
      "expired-callback": () => tokenCallback.current?.(null),
      "error-callback": () => {
        setFailed(true);
        tokenCallback.current?.(null);
      },
    });
  }, [siteKey, action]);

  useEffect(() => {
    if (ready) render();
    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [ready, render]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
      tokenCallback.current?.(null);
    },
  }));

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
        onError={() => setFailed(true)}
      />
      <div ref={container} className="min-h-[65px]" />
      {failed && (
        <p role="alert" className="text-sm text-[#ff9aa6]">
          The verification check could not load. Check your connection or disable content blockers, then reload the page.
        </p>
      )}
    </>
  );
});
