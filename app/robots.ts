import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/data/public";
import { siteUrl } from "@/lib/supabase/env";

/*
 * The admin area is deliberately NOT listed here: a Disallow line would advertise its path.
 * It is kept out of search results with noindex headers instead (see next.config.ts).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings();
  const base = (settings.siteUrl ?? siteUrl).replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
