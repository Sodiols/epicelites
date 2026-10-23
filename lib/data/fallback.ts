import raw from "@/content/team.json";
import type { MediaItem, Player, SiteSettings } from "./public";

/*
 * Setup-mode content. Used ONLY while Supabase environment variables are missing, so a fresh
 * checkout renders the original site. content/team.json is otherwise just the seed source
 * (see scripts/generate-seed.mjs); it is never read once Supabase is configured.
 */

type LegacyTeam = {
  teamName: string;
  game: string;
  tagline: string;
  description: string;
  email: string;
  socials: Record<string, string>;
  players: { name: string; role: string; number: string; image: string; bio: string }[];
};

const team = raw as LegacyTeam;

const sizes: Record<string, [number, number]> = {
  "player-01.webp": [422, 591],
  "player-02.webp": [447, 559],
  "player-03.webp": [1060, 1484],
  "player-04.webp": [422, 591],
  "player-05.webp": [422, 591],
  "player-06.webp": [571, 793],
};

export const fallbackSettings: SiteSettings = {
  teamName: team.teamName,
  game: team.game,
  tagline: team.tagline,
  description: team.description,
  contactEmail: team.email || null,
  siteUrl: null,
  location: null,
  socials: Object.entries(team.socials)
    .filter(([, url]) => url.startsWith("https://"))
    .map(([network, url]) => ({ network, url })),
  logoUrl: "/images/epic-elites-mark.webp",
  faviconUrl: "/images/epic-elites-mark.webp",
  ogImageUrl: "/images/team-kit.webp",
  jerseyFrontUrl: "/images/jersey-front.webp",
  jerseyBackUrl: "/images/jersey-back.webp",
  kitImageUrl: "/images/team-kit.webp",
  jerseyEditionLabel: null,
  heroSubtitle: "Six players in one black and violet kit, built to outlast every zone.",
  statement:
    "Epic Elites is a Free Fire team built on trust in the lineup, hours of practice and a standard that rises every match. The name on the jersey is a promise we play to keep.",
  footerDescription: `${team.teamName} is a ${team.game} esports team. Roster, fixtures and team news live here.`,
  aboutLead: `${team.teamName} competes in ${team.game} with one lineup, one kit and one standard.`,
  aboutBody:
    "This site is where the team keeps its roster, fixtures, media and official news. As the team grows, it records the players and the matches that shape the name.",
  featuredMatchId: null,
  featuredNewsId: null,
};

export const fallbackPlayers: Player[] = team.players.map((p) => {
  const [width, height] = sizes[p.image] ?? [800, 1000];
  return {
    id: `local-${p.number}`,
    slug: `player-${p.number}`,
    legacyKey: p.number,
    name: p.name,
    inGameName: null,
    role: p.role,
    number: p.number,
    bio: p.bio,
    image: { src: `/images/${p.image}`, width, height, onBlack: p.image === "player-06.webp" },
    region: null,
    socials: [],
    isFeatured: false,
  };
});

export const fallbackMedia: MediaItem[] = [
  {
    id: "local-kit",
    kind: "image",
    category: "kit",
    collection: null,
    title: "Team kit",
    caption: "Team kit, front and back",
    alt_text: "Epic Elites jersey shown front and back on mannequins",
    url: "/images/team-kit.webp",
    width: 1422,
    height: 1106,
    on_black: false,
    video_url: null,
    is_featured: false,
    display_order: 0,
    created_at: "2026-01-01T00:00:00Z",
  },
  ...fallbackPlayers.map((p, i) => ({
    id: `local-media-${p.slug}`,
    kind: "image" as const,
    category: "players" as const,
    collection: null,
    title: null,
    caption: p.name,
    alt_text: `${p.name} in the Epic Elites jersey`,
    url: p.image!.src,
    width: p.image!.width,
    height: p.image!.height,
    on_black: p.image!.onBlack,
    video_url: null,
    is_featured: false,
    display_order: i + 1,
    created_at: "2026-01-01T00:00:00Z",
  })),
];
