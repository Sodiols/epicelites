/**
 * Database types matching supabase/migrations. Keep in sync when the schema changes
 * (or regenerate with `npx supabase gen types typescript --linked`).
 */

type Timestamps = { created_at: string; updated_at: string; created_by: string | null; updated_by: string | null };

type TableDef<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

type ViewDef<Row> = { Row: Row; Relationships: [] };

export type MatchFormat = "battle_royale" | "clash_squad" | "scrim" | "other";
export type MatchScoring = "placement" | "head_to_head";
export type MatchStatus = "upcoming" | "live" | "completed" | "postponed" | "cancelled";
export type NewsStatus = "draft" | "published" | "archived";
export type NewsCategory =
  | "team_news"
  | "tournament_updates"
  | "match_results"
  | "roster_announcements"
  | "official_announcements";
export type MediaKind = "image" | "video";
export type MediaCategory = "team" | "players" | "kit" | "tournament" | "graphics" | "other";
export type PartnerType = "sponsor" | "partner" | "supplier" | "media" | "other";
export type InquiryCategory = "partnership" | "tournament" | "media" | "general";
export type MessageStatus = "unread" | "read" | "archived";
export type AdminRole = "owner" | "editor";

export type AdminUserRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  role: AdminRole;
  is_active: boolean;
} & Timestamps;

export type PlayerRow = {
  id: string;
  slug: string;
  legacy_key: string | null;
  display_name: string;
  in_game_name: string | null;
  role: string;
  jersey_number: string | null;
  bio: string | null;
  photo_url: string | null;
  photo_path: string | null;
  photo_width: number | null;
  photo_height: number | null;
  photo_on_black: boolean;
  region: string | null;
  socials: Record<string, string>;
  joined_on: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
} & Timestamps;

export type MatchRow = {
  id: string;
  format: MatchFormat;
  scoring: MatchScoring;
  event_name: string;
  stage: string | null;
  opponent: string | null;
  organizer: string | null;
  starts_at: string;
  time_zone: string;
  description: string | null;
  cover_url: string | null;
  cover_path: string | null;
  stream_url: string | null;
  info_url: string | null;
  status: MatchStatus;
  is_published: boolean;
  is_featured: boolean;
  br_placement: number | null;
  br_kills: number | null;
  br_placement_points: number | null;
  br_kill_points: number | null;
  br_total_points: number | null;
  br_rounds_played: number | null;
  h2h_team_score: number | null;
  h2h_opponent_score: number | null;
  h2h_outcome: "win" | "loss" | "draw" | null;
  result_confirmed: boolean;
  completed_at: string | null;
  result_notes: string | null;
} & Timestamps;

export type RoundRow = {
  id: string;
  match_id: string;
  round_number: number;
  map_name: string | null;
  placement: number | null;
  kills: number | null;
  placement_points: number | null;
  kill_points: number | null;
  total_points: number | null;
} & Timestamps;

export type NewsRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  cover_url: string | null;
  cover_path: string | null;
  cover_alt: string | null;
  category: NewsCategory;
  author_name: string | null;
  status: NewsStatus;
  published_at: string | null;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
} & Timestamps;

export type PartnerRow = {
  id: string;
  name: string;
  logo_url: string | null;
  logo_path: string | null;
  website_url: string | null;
  partner_type: PartnerType;
  is_active: boolean;
  display_order: number;
} & Timestamps;

export type MediaRow = {
  id: string;
  kind: MediaKind;
  category: MediaCategory;
  collection: string | null;
  title: string | null;
  caption: string | null;
  alt_text: string | null;
  url: string | null;
  storage_path: string | null;
  width: number | null;
  height: number | null;
  on_black: boolean;
  video_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  display_order: number;
  player_id: string | null;
  news_id: string | null;
  match_id: string | null;
  partner_id: string | null;
} & Timestamps;

export type SettingsRow = {
  id: number;
  team_name: string;
  game: string;
  tagline: string | null;
  description: string | null;
  contact_email: string | null;
  site_url: string | null;
  location: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  discord_url: string | null;
  logo_url: string;
  favicon_url: string;
  og_image_url: string;
  jersey_front_url: string;
  jersey_back_url: string;
  kit_image_url: string;
  jersey_edition_label: string | null;
  hero_subtitle: string | null;
  statement: string | null;
  footer_description: string | null;
  about_lead: string | null;
  about_body: string | null;
  featured_match_id: string | null;
  featured_news_id: string | null;
  updated_at: string;
  updated_by: string | null;
};

export type MessageRow = {
  id: string;
  name: string;
  email: string;
  category: InquiryCategory;
  message: string;
  status: MessageStatus;
  created_at: string;
  read_at: string | null;
  archived_at: string | null;
};

export type AuditRow = {
  id: number;
  occurred_at: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  resource_label: string | null;
  summary: string | null;
};

export type PublicSettings = Omit<SettingsRow, "id" | "updated_by">;
export type PublicPlayer = Pick<
  PlayerRow,
  | "id" | "slug" | "legacy_key" | "display_name" | "in_game_name" | "role" | "jersey_number" | "bio"
  | "photo_url" | "photo_width" | "photo_height" | "photo_on_black" | "region" | "socials" | "joined_on"
  | "is_featured" | "display_order"
>;
export type PublicMatch = Omit<
  MatchRow,
  "cover_path" | "is_published" | "result_notes" | keyof Timestamps
>;
export type PublicRound = Omit<RoundRow, keyof Timestamps>;
export type PublicNews = Omit<NewsRow, "cover_path" | "status" | "created_at" | "created_by" | "updated_by">;
export type PublicMedia = Pick<
  MediaRow,
  | "id" | "kind" | "category" | "collection" | "title" | "caption" | "alt_text" | "url" | "width" | "height"
  | "on_black" | "video_url" | "is_featured" | "display_order" | "created_at"
>;
export type PublicPartner = Pick<PartnerRow, "id" | "name" | "logo_url" | "website_url" | "partner_type" | "display_order">;

export type Database = {
  public: {
    Tables: {
      admin_users: TableDef<AdminUserRow, "user_id" | "email" | "role">;
      players: TableDef<PlayerRow, "slug" | "display_name">;
      matches: TableDef<MatchRow, "format" | "scoring" | "event_name" | "starts_at">;
      match_round_results: TableDef<RoundRow, "match_id" | "round_number">;
      news_posts: TableDef<NewsRow, "slug" | "title">;
      partners: TableDef<PartnerRow, "name">;
      media_items: TableDef<MediaRow, never>;
      team_settings: TableDef<SettingsRow, never>;
      contact_messages: TableDef<MessageRow, "name" | "email" | "category" | "message">;
      audit_logs: TableDef<AuditRow, "action" | "resource_type">;
    };
    Views: {
      public_settings: ViewDef<PublicSettings>;
      public_players: ViewDef<PublicPlayer>;
      public_matches: ViewDef<PublicMatch>;
      public_match_rounds: ViewDef<PublicRound>;
      public_news: ViewDef<PublicNews>;
      public_media: ViewDef<PublicMedia>;
      public_partners: ViewDef<PublicPartner>;
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_owner: { Args: Record<string, never>; Returns: boolean };
      submit_contact_message: {
        Args: { p_name: string; p_email: string; p_category: string; p_message: string };
        Returns: string;
      };
      admin_grant_access: {
        Args: { p_email: string; p_role: string; p_display_name?: string | null };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
