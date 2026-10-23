import { z } from "zod";
import { assetUrl, checkbox, optionalText, requiredText, slug } from "./common";
import { isValidTimeZone } from "@/lib/time";

export const newsSchema = z.object({
  title: requiredText(140, "Enter a headline."),
  slug,
  summary: optionalText(300),
  body: z.string().max(50000, "The article is too long (50,000 characters at most)."),
  category: z.enum(["team_news", "tournament_updates", "match_results", "roster_announcements", "official_announcements"]),
  author_name: optionalText(80),
  is_featured: checkbox,
  seo_title: optionalText(70),
  seo_description: optionalText(170),
  cover_url: assetUrl.optional().transform((v) => v ?? null),
  cover_path: optionalText(300),
  cover_alt: optionalText(200),
  publish_local: z.string().optional(),
  publish_tz: z.string().refine(isValidTimeZone, "Choose a valid time zone.").optional(),
  intent: z.enum(["draft", "publish", "schedule", "update"]),
});
