/** Search and sharing identity; independent of editable page content. */
export const SITE_NAME = "EPIC ELITES";
export const DEFAULT_SITE_ORIGIN = "https://epicelites.vercel.app";

/** One origin for metadata, structured data and discovery endpoints. Never use a preview host. */
export function getSiteOrigin(configuredOrigin?: string | null): string {
  for (const candidate of [configuredOrigin, process.env.NEXT_PUBLIC_SITE_URL]) {
    if (!candidate?.trim()) continue;
    try {
      const url = new URL(candidate.trim());
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) continue;
      if (process.env.NODE_ENV === "production" && (
        url.protocol !== "https:" || /^(localhost|127\..*|\[::1\])$/i.test(url.hostname)
      )) continue;
      return url.origin;
    } catch {
      // An absent or invalid setting must not publish broken canonical URLs.
    }
  }
  return DEFAULT_SITE_ORIGIN;
}
