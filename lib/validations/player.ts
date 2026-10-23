import { z } from "zod";
import { assetUrl, checkbox, optionalHttpsUrl, optionalInt, optionalText, requiredText, slug } from "./common";

export const PLAYER_SOCIALS = ["instagram", "youtube", "tiktok", "facebook", "x"] as const;

export const playerSchema = z
  .object({
    display_name: requiredText(60, "Enter the player's display name."),
    in_game_name: optionalText(40),
    role: requiredText(60, "Enter a role, or 'Role to be confirmed'."),
    jersey_number: z
      .string()
      .trim()
      .regex(/^(\d{1,3})?$/, "Use up to three digits.")
      .transform((v) => (v === "" ? null : v)),
    slug,
    bio: optionalText(1200),
    region: optionalText(60),
    joined_on: z
      .string()
      .trim()
      .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Choose a valid date.")
      .transform((v) => (v === "" ? null : v)),
    is_active: checkbox,
    is_featured: checkbox,
    photo_on_black: checkbox,
    photo_url: assetUrl.optional().transform((v) => v ?? null),
    photo_path: optionalText(300),
    photo_width: optionalInt(1, 20000),
    photo_height: optionalInt(1, 20000),
    social_instagram: optionalHttpsUrl,
    social_youtube: optionalHttpsUrl,
    social_tiktok: optionalHttpsUrl,
    social_facebook: optionalHttpsUrl,
    social_x: optionalHttpsUrl,
  })
  .transform(({ social_instagram, social_youtube, social_tiktok, social_facebook, social_x, ...rest }) => {
    const socials: Record<string, string> = {};
    const entries = { instagram: social_instagram, youtube: social_youtube, tiktok: social_tiktok, facebook: social_facebook, x: social_x };
    for (const [k, v] of Object.entries(entries)) if (v) socials[k] = v;
    return { ...rest, socials };
  });
