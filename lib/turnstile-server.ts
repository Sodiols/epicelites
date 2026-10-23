import "server-only";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult = { ok: true } | { ok: false; reason: "disabled" | "misconfigured" | "missing" | "rejected" | "unavailable" };

/** Turnstile is on once either key is configured; from then on every check fails closed. */
export const turnstileEnabled = () =>
  Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || process.env.TURNSTILE_SECRET_KEY);

/** Hostnames allowed to issue tokens, from TURNSTILE_HOSTNAMES (comma-separated). */
function allowedHostnames(): string[] {
  return (process.env.TURNSTILE_HOSTNAMES ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Verifies a Turnstile token with Cloudflare. Rejects anything that is not a fresh token for
 * this exact action, issued on one of our hostnames. Network errors, timeouts, bad HTTP
 * statuses and unparseable responses all count as failure. Tokens are single-use, so a
 * replayed token is rejected by Cloudflare.
 */
export async function verifyTurnstile(token: unknown, action: string, remoteIp: string): Promise<TurnstileResult> {
  if (!turnstileEnabled()) return { ok: false, reason: "disabled" };

  const secret = process.env.TURNSTILE_SECRET_KEY;
  const hostnames = allowedHostnames();
  if (!secret || hostnames.length === 0) {
    console.error("Turnstile is enabled but TURNSTILE_SECRET_KEY or TURNSTILE_HOSTNAMES is not set");
    return { ok: false, reason: "misconfigured" };
  }

  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return { ok: false, reason: "missing" };

  let data: {
    success?: unknown;
    action?: unknown;
    hostname?: unknown;
    "error-codes"?: unknown;
    metadata?: { result_with_testing_key?: unknown };
  };
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);
    const res = await fetch(SITEVERIFY, {
      method: "POST",
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false, reason: "unavailable" };
    data = await res.json();
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  // Cloudflare's public test keys (used for local development, because widgets cannot list
  // localhost) answer for "example.com" with no action. Accept them only outside production;
  // in production a test-key result is always rejected.
  if (data.metadata?.result_with_testing_key === true) {
    return process.env.NODE_ENV !== "production" && data.success === true ? { ok: true } : { ok: false, reason: "rejected" };
  }

  const hostname = typeof data.hostname === "string" ? data.hostname.toLowerCase() : "";
  if (data.success !== true || data.action !== action || !hostnames.includes(hostname)) {
    return { ok: false, reason: "rejected" };
  }
  return { ok: true };
}
