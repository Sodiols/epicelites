import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  NewsCategory,
  PublicMatch,
  PublicMedia,
  PublicNews,
  PublicPartner,
  PublicPlayer,
  PublicRound,
  PublicSettings,
} from "@/lib/supabase/types";
import { fallbackMedia, fallbackPlayers, fallbackSettings } from "./fallback";

/*
 * Every public page reads through these functions. They query only the public_* views,
 * so drafts, unconfirmed results and private fields can never reach a visitor.
 *
 * Setup mode: until NEXT_PUBLIC_SUPABASE_URL and the publishable key are set, the site
 * renders the original content/team.json data so it still works before Supabase exists.
 * Once Supabase is configured it is the only source of truth, and query errors surface
 * as errors instead of being papered over with stale local content.
 */

export type ImageAsset = { src: string; width: number; height: number; onBlack: boolean };

export type SiteSettings = {
  teamName: string;
  game: string;
  tagline: string | null;
  description: string | null;
  contactEmail: string | null;
  siteUrl: string | null;
  location: string | null;
  socials: { network: string; url: string }[];
  logoUrl: string;
  faviconUrl: string;
  ogImageUrl: string;
  jerseyFrontUrl: string;
  jerseyBackUrl: string;
  kitImageUrl: string;
  jerseyEditionLabel: string | null;
  heroSubtitle: string;
  statement: string;
  footerDescription: string;
  aboutLead: string;
  aboutBody: string;
  featuredMatchId: string | null;
  featuredNewsId: string | null;
};

export type Player = {
  id: string;
  slug: string;
  legacyKey: string | null;
  name: string;
  inGameName: string | null;
  role: string;
  number: string | null;
  bio: string | null;
  image: ImageAsset | null;
  region: string | null;
  socials: { network: string; url: string }[];
  isFeatured: boolean;
};

export type Match = PublicMatch & { rounds: PublicRound[] };
export type NewsPost = PublicNews;
export type MediaItem = PublicMedia;
export type Partner = PublicPartner;

function fail(what: string, error: { message: string }): never {
  throw new Error(`Could not load ${what} from Supabase: ${error.message}`);
}

const SOCIAL_KEYS = ["facebook", "instagram", "youtube", "tiktok", "discord"] as const;

export function mapSettings(s: PublicSettings): SiteSettings {
  const fb = fallbackSettings;
  return {
    teamName: s.team_name,
    game: s.game,
    tagline: s.tagline,
    description: s.description,
    contactEmail: s.contact_email,
    siteUrl: s.site_url,
    location: s.location,
    socials: SOCIAL_KEYS.flatMap((k) => {
      const url = s[`${k}_url`];
      return url ? [{ network: k, url }] : [];
    }),
    logoUrl: s.logo_url,
    faviconUrl: s.favicon_url,
    ogImageUrl: s.og_image_url,
    jerseyFrontUrl: s.jersey_front_url,
    jerseyBackUrl: s.jersey_back_url,
    kitImageUrl: s.kit_image_url,
    jerseyEditionLabel: s.jersey_edition_label,
    heroSubtitle: s.hero_subtitle || fb.heroSubtitle,
    statement: s.statement || fb.statement,
    footerDescription: s.footer_description || `${s.team_name} is a ${s.game} esports team.`,
    aboutLead: s.about_lead || fb.aboutLead,
    aboutBody: s.about_body || fb.aboutBody,
    featuredMatchId: s.featured_match_id,
    featuredNewsId: s.featured_news_id,
  };
}

export function mapPlayer(p: PublicPlayer): Player {
  return {
    id: p.id,
    slug: p.slug,
    legacyKey: p.legacy_key,
    name: p.display_name,
    inGameName: p.in_game_name,
    role: p.role,
    number: p.jersey_number,
    bio: p.bio,
    image: p.photo_url
      ? { src: p.photo_url, width: p.photo_width ?? 800, height: p.photo_height ?? 1000, onBlack: p.photo_on_black }
      : null,
    region: p.region,
    socials: Object.entries(p.socials ?? {})
      .filter(([, url]) => typeof url === "string" && url.startsWith("https://"))
      .map(([network, url]) => ({ network, url })),
    isFeatured: p.is_featured,
  };
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  if (!isSupabaseConfigured) return fallbackSettings;
  const { data, error } = await createPublicClient().from("public_settings").select("*").maybeSingle();
  if (error) fail("site settings", error);
  return data ? mapSettings(data) : fallbackSettings;
});

export const getPlayers = cache(async (): Promise<Player[]> => {
  if (!isSupabaseConfigured) return fallbackPlayers;
  const { data, error } = await createPublicClient()
    .from("public_players")
    .select("*")
    .order("display_order")
    .order("display_name");
  if (error) fail("players", error);
  return (data ?? []).map(mapPlayer);
});

/** Players for the homepage lineup: the featured ones if any are featured, otherwise everyone. */
export async function getLineup(): Promise<Player[]> {
  const players = await getPlayers();
  const featured = players.filter((p) => p.isFeatured);
  return featured.length > 0 ? featured : players;
}

export const getMatches = cache(async (): Promise<{ upcoming: Match[]; results: Match[]; other: Match[] }> => {
  if (!isSupabaseConfigured) return { upcoming: [], results: [], other: [] };
  const supabase = createPublicClient();
  const [{ data, error }, rounds] = await Promise.all([
    supabase.from("public_matches").select("*").order("starts_at"),
    supabase.from("public_match_rounds").select("*").order("round_number"),
  ]);
  if (error) fail("matches", error);
  if (rounds.error) fail("match rounds", rounds.error);

  const byMatch = new Map<string, PublicRound[]>();
  for (const r of rounds.data ?? []) byMatch.set(r.match_id, [...(byMatch.get(r.match_id) ?? []), r]);
  const all: Match[] = (data ?? []).map((m) => ({ ...m, rounds: byMatch.get(m.id) ?? [] }));

  // Soonest first for fixtures; most recently completed first for results.
  const upcoming = all.filter((m) => m.status === "upcoming" || m.status === "live");
  const results = all
    .filter((m) => m.status === "completed" && m.result_confirmed)
    .sort((a, b) => (b.completed_at ?? b.starts_at).localeCompare(a.completed_at ?? a.starts_at));
  const other = all.filter((m) => m.status === "postponed" || m.status === "cancelled");
  return { upcoming, results, other };
});

/** The match the homepage should feature: the admin's pick if still upcoming, else the next one. */
export async function getNextMatch(): Promise<Match | null> {
  const [{ upcoming }, settings] = await Promise.all([getMatches(), getSettings()]);
  const pinned = upcoming.find((m) => m.id === settings.featuredMatchId) ?? upcoming.find((m) => m.is_featured);
  return pinned ?? upcoming[0] ?? null;
}

export const NEWS_PAGE_SIZE = 9;

export const getNewsPage = cache(
  async (page: number, category?: NewsCategory): Promise<{ posts: NewsPost[]; total: number }> => {
    if (!isSupabaseConfigured) return { posts: [], total: 0 };
    const from = (page - 1) * NEWS_PAGE_SIZE;
    let query = createPublicClient()
      .from("public_news")
      .select("*", { count: "exact" })
      .order("published_at", { ascending: false })
      .range(from, from + NEWS_PAGE_SIZE - 1);
    if (category) query = query.eq("category", category);
    const { data, error, count } = await query;
    if (error) fail("news", error);
    return { posts: data ?? [], total: count ?? 0 };
  },
);

export const getFeaturedNews = cache(async (): Promise<NewsPost | null> => {
  if (!isSupabaseConfigured) return null;
  const settings = await getSettings();
  const supabase = createPublicClient();
  if (settings.featuredNewsId) {
    const { data, error } = await supabase.from("public_news").select("*").eq("id", settings.featuredNewsId).maybeSingle();
    if (error) fail("featured news", error);
    if (data) return data;
  }
  const { data, error } = await supabase
    .from("public_news")
    .select("*")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) fail("featured news", error);
  return data;
});

export const getNewsBySlug = cache(async (slug: string): Promise<NewsPost | null> => {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await createPublicClient().from("public_news").select("*").eq("slug", slug).maybeSingle();
  if (error) fail("article", error);
  return data;
});

export const getAllNewsSlugs = cache(async (): Promise<{ slug: string; updated_at: string }[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await createPublicClient().from("public_news").select("slug, updated_at").limit(1000);
  if (error) fail("news index", error);
  return data ?? [];
});

export const getMedia = cache(async (): Promise<MediaItem[]> => {
  if (!isSupabaseConfigured) return fallbackMedia;
  const { data, error } = await createPublicClient()
    .from("public_media")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("display_order")
    .order("created_at", { ascending: false });
  if (error) fail("media", error);
  return data ?? [];
});

export const getPartners = cache(async (): Promise<Partner[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await createPublicClient().from("public_partners").select("*").order("display_order");
  if (error) fail("partners", error);
  return data ?? [];
});
