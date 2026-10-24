"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize, type ActionResult } from "@/lib/auth/admin";
import { refreshPublicSite } from "@/lib/admin/revalidate";
import { removeStorageObjects, storagePathFromUrl } from "@/lib/admin/storage";
import type { SettingsRow } from "@/lib/supabase/types";
import { assetUrl, fieldErrors, formToObject, optionalHttpsUrl, optionalText, requiredText, uuid } from "@/lib/validations/common";

/** Brand images fall back to the artwork shipped with the site if an admin removes one. */
const BRAND = {
  logo: "/images/epic-elites-mark.webp",
  favicon: "/images/epic-elites-mark.webp",
  og_image: "/images/team-kit-v2.webp",
  jersey_front: "/images/jersey-front-v2.webp",
  jersey_back: "/images/jersey-back-v2.webp",
  kit_image: "/images/team-kit-v2.webp",
} as const;

const optionalId = z
  .string()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || uuid.safeParse(v).success, "Choose an item from the list.");

const schema = z.object({
  team_name: requiredText(80, "Enter the team name."),
  game: requiredText(60, "Enter the game."),
  tagline: optionalText(80),
  description: optionalText(400),
  contact_email: z
    .string()
    .trim()
    .max(320)
    .transform((v) => (v === "" ? null : v.toLowerCase()))
    .refine((v) => v === null || z.string().email().safeParse(v).success, "Enter a valid email address."),
  site_url: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v.replace(/\/+$/, "")))
    .refine((v) => v === null || /^https?:\/\/[^\s/]+$/i.test(v), "Use the bare domain, like https://epicelites.gg"),
  location: optionalText(80),
  facebook_url: optionalHttpsUrl,
  instagram_url: optionalHttpsUrl,
  youtube_url: optionalHttpsUrl,
  tiktok_url: optionalHttpsUrl,
  discord_url: optionalHttpsUrl,
  jersey_edition_label: optionalText(60),
  hero_subtitle: optionalText(140),
  statement: optionalText(400),
  footer_description: optionalText(200),
  about_lead: optionalText(200),
  about_body: optionalText(1200),
  featured_match_id: optionalId,
  featured_news_id: optionalId,
  ...Object.fromEntries(Object.keys(BRAND).map((k) => [`${k}_url`, assetUrl.optional().transform((v) => v ?? null)])),
});

export async function saveSettings(form: FormData): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  const raw = formToObject(form);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const data = parsed.data as Record<string, string | null>;

  const values: Record<string, string | null> = { ...data };
  for (const [key, fallback] of Object.entries(BRAND)) values[`${key}_url`] = data[`${key}_url`] || fallback;

  const db = auth.admin.supabase;
  const { data: before } = await db.from("team_settings").select("*").eq("id", 1).maybeSingle();
  const { error } = await db.from("team_settings").update(values as Partial<SettingsRow>).eq("id", 1);
  if (error) return { ok: false, message: "The settings could not be saved. Reload the page and try again." };

  // Remove uploaded brand files that were replaced (shipped artwork has no storage path).
  if (before) {
    const stale = Object.keys(BRAND).map((k) => {
      const oldUrl = before[`${k}_url` as keyof SettingsRow] as string | null;
      // Only delete when no setting still points at the old file.
      return oldUrl && !Object.values(values).includes(oldUrl) ? storagePathFromUrl(oldUrl) : null;
    });
    await removeStorageObjects(auth.admin, stale);
  }

  refreshPublicSite();
  revalidatePath("/EEAUTHOR", "layout");
  return { ok: true, message: "Website settings saved" };
}
