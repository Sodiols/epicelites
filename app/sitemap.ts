import type { MetadataRoute } from "next";
import { getAllNewsSlugs, getSettings } from "@/lib/data/public";
import { siteUrl } from "@/lib/supabase/env";

export const revalidate = 3600;

/** Public pages plus published articles only. The admin area is never listed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, posts] = await Promise.all([getSettings(), getAllNewsSlugs()]);
  const base = (settings.siteUrl ?? siteUrl).replace(/\/$/, "");
  const pages = ["", "/roster", "/matches", "/media", "/news", "/about", "/contact"].map((path) => ({
    url: `${base}${path}`,
  }));
  const articles = posts.map((p) => ({ url: `${base}/news/${p.slug}`, lastModified: p.updated_at }));
  return [...pages, ...articles];
}
