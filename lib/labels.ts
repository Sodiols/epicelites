import type {
  InquiryCategory,
  MatchFormat,
  MatchStatus,
  MediaCategory,
  NewsCategory,
  PartnerType,
} from "@/lib/supabase/types";

export const MATCH_FORMATS: Record<MatchFormat, string> = {
  battle_royale: "Battle Royale",
  clash_squad: "Clash Squad",
  scrim: "Scrim",
  other: "Other format",
};

export const MATCH_STATUSES: Record<MatchStatus, string> = {
  upcoming: "Upcoming",
  live: "Live",
  completed: "Completed",
  postponed: "Postponed",
  cancelled: "Cancelled",
};

export const NEWS_CATEGORIES: Record<NewsCategory, string> = {
  team_news: "Team News",
  tournament_updates: "Tournament Updates",
  match_results: "Match Results",
  roster_announcements: "Roster Announcements",
  official_announcements: "Official Announcements",
};

export const MEDIA_CATEGORIES: Record<MediaCategory, string> = {
  team: "Team",
  players: "Players",
  kit: "Kit",
  tournament: "Tournament",
  graphics: "Graphics",
  other: "Other",
};

export const PARTNER_TYPES: Record<PartnerType, string> = {
  sponsor: "Sponsor",
  partner: "Partner",
  supplier: "Supplier",
  media: "Media partner",
  other: "Other",
};

export const INQUIRY_CATEGORIES: Record<InquiryCategory, string> = {
  partnership: "Partnership",
  tournament: "Tournament invitation",
  media: "Media request",
  general: "General message",
};

export const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};
