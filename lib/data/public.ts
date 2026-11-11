import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  NewsCategory,
  PlayerStatistic,
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
  joinedOn: string | null;
  achievements: string | null;
  competitiveHistory: string | null;
  image: ImageAsset | null;
  region: string | null;
  socials: { network: string; url: string }[];
  isFeatured: boolean;
};

export type Match = PublicMatch & { rounds: PublicRound[]; playerStatistics: PlayerStatistic[] };
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
    joinedOn: p.joined_on,
    achievements: null,
    competitiveHistory: null,
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

export const getPlayers = cache(async (includeDetails = false): Promise<Player[]> => {
  if (!isSupabaseConfigured) return fallbackPlayers;
  const client = createPublicClient();
  const { data, error } = await client
    .from("public_players")
    .select("*")
    .order("display_order")
    .order("display_name");
  if (error) fail("players", error);
  const players = (data ?? []).map(mapPlayer);
  if (!includeDetails || !players.length) return players;

  const details = await client.from("public_player_details").select("*");
  // Older installations can still serve the existing roster during migration rollout.
  if (details.error && details.error.code !== "PGRST205") fail("player profiles", details.error);
  const byId = new Map((details.data ?? []).map((p) => [p.id, p]));
  return players.map((player) => ({
    ...player,
    achievements: byId.get(player.id)?.achievements ?? null,
    competitiveHistory: byId.get(player.id)?.competitive_history ?? null,
  }));
});

/** Players for the homepage lineup: the featured ones if any are featured, otherwise everyone. */
export async function getLineup(): Promise<Player[]> {
  const players = await getPlayers();
  const featured = players.filter((p) => p.isFeatured);
  return featured.length > 0 ? featured : players;
}

export const getMatches = cache(async (includeStatistics = false) => {
  if (!isSupabaseConfigured) return { upcoming: [], results: [], other: [] };
  const supabase = createPublicClient();
  const [matches, rounds, statistics] = await Promise.all([
    readArchivePages("matches", (from, to) => supabase.from("public_matches").select("*").order("starts_at").order("id").range(from, to)),
    includeStatistics
      ? readArchivePages("match rounds", (from, to) => supabase.from("public_match_rounds").select("*").order("round_number").order("id").range(from, to))
      : [],
    includeStatistics
      ? readArchivePages("player statistics", (from, to) => supabase.from("public_match_statistics").select("*").order("id").range(from, to), true)
      : [],
  ]);

  const byMatch = new Map<string, PublicRound[]>();
  for (const r of rounds) {
    const list = byMatch.get(r.match_id) ?? [];
    list.push(r);
    byMatch.set(r.match_id, list);
  }
  const statsByMatch = new Map(statistics.map((row) => [row.id, row.player_statistics]));
  const all: Match[] = matches.map((m) => ({
    ...m,
    rounds: byMatch.get(m.id) ?? [],
    playerStatistics: statsByMatch.get(m.id) ?? [],
  }));

  const live = all.filter((m) => m.status === "live");
  const scheduled = all.filter((m) => m.status === "upcoming");
  const upcoming = [...live, ...scheduled];
  const results = all
    .filter((m) => m.status === "completed" && m.result_confirmed)
    .reverse();
  const other = all.filter((m) => m.status === "postponed" || m.status === "cancelled");
  return { upcoming, results, other };
});

async function readArchivePages<Row>(
  label: string,
  query: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: { code: string; message: string } | null }>,
  allowMissingView = false,
): Promise<Row[]> {
  const pageSize = 500;
  const rows: Row[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await query(from, from + pageSize - 1);
    if (error) {
      if (allowMissingView && error.code === "PGRST205") return [];
      fail(label, error);
    }
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return rows;
  }
}

export const getMatchCenter = cache(async (includeStatistics = false) => {
  // Evaluate the clock on each request, while retaining the shared Supabase data cache.
  await connection();
  const [matches, settings] = await Promise.all([getMatches(includeStatistics), getSettings()]);
  const now = Date.now();
  const upcoming = matches.upcoming.filter((m) => m.status === "live" || Date.parse(m.starts_at) > now);
  const featured = upcoming.find((m) => m.status === "live")
    ?? upcoming.find((m) => m.id === settings.featuredMatchId)
    ?? upcoming.find((m) => m.is_featured)
    ?? upcoming[0]
    ?? null;
  const fixtures = featured ? [featured, ...upcoming.filter((m) => m.id !== featured.id)] : upcoming;
  const notices = matches.other.filter((m) => Date.parse(m.starts_at) > now);
  return { featured, fixtures: [...fixtures, ...notices], results: matches.results, settings };
});

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
