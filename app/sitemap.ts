import type { MetadataRoute } from "next";
import { getAllNewsSlugs, getSettings } from "@/lib/data/public";
import { siteUrl } from "@/lib/supabase/env";

export const revalidate = 3600;

/**
 * Public pages plus published articles. The admin area and the contact thank-you page are
 * never listed (the latter is noindex).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, posts] = await Promise.all([getSettings(), getAllNewsSlugs()]);
  const base = (settings.siteUrl ?? siteUrl).replace(/\/$/, "");

  const pages: { path: string; changeFrequency: "daily" | "weekly" | "monthly"; priority: number }[] = [
    { path: "", changeFrequency: "daily", priority: 1 },
    { path: "/matches", changeFrequency: "daily", priority: 0.9 },
    { path: "/roster", changeFrequency: "weekly", priority: 0.8 },
    { path: "/news", changeFrequency: "daily", priority: 0.8 },
    { path: "/media", changeFrequency: "weekly", priority: 0.6 },
    { path: "/about", changeFrequency: "monthly", priority: 0.6 },
    { path: "/faq", changeFrequency: "monthly", priority: 0.5 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  ];

  return [
    ...pages.map((p) => ({ url: `${base}${p.path}`, changeFrequency: p.changeFrequency, priority: p.priority })),
    ...posts.map((p) => ({
      url: `${base}/news/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
