/**
 * Supabase connection settings. Only public (browser-safe) values live here; no secret or
 * service-role key is used anywhere in this project.
 *
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is the current key name. Projects that still use the
 * legacy anon key can set NEXT_PUBLIC_SUPABASE_ANON_KEY instead.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseKey.length > 0;

/** Canonical public origin, without a trailing slash. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const MEDIA_BUCKET = "media";

/** Cache tag shared by every public read and expired by every admin write. */
export const PUBLIC_CONTENT_TAG = "ee-public-content";

/** Longest a visitor can see stale content, and the precision of scheduled publishing. */
export const PUBLIC_REVALIDATE_SECONDS = 60;
