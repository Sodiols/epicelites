-- Epic Elites CMS: core schema. Safe to run more than once.
-- Tables hold every piece of editable site content. Public visitors never read these
-- tables directly; they read the filtered views created in the security migration.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end;
$$;

-- An asset URL is either a file shipped with the site (/images/...) or an https URL
-- (Supabase Storage public URLs). Anything else (javascript:, data:, http:) is rejected.
create or replace function public.is_asset_url(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value is null
    or value ~ '^/images/[A-Za-z0-9._/-]+$'
    or value ~* '^https://[^\s<>"'']+$';
$$;

create or replace function public.is_https_url(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value is null or (value ~* '^https://[^\s<>"'']+$' and char_length(value) <= 500);
$$;

-- ---------------------------------------------------------------------------
-- Administrators
-- ---------------------------------------------------------------------------

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null check (char_length(email) <= 320),
  display_name text check (char_length(display_name) <= 80),
  role text not null check (role in ('owner', 'editor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists admin_users_role_idx on public.admin_users (role) where is_active;

-- ---------------------------------------------------------------------------
-- Players
-- ---------------------------------------------------------------------------

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  -- Key used by the original site's ?player=03 links, kept so old links still resolve.
  legacy_key text unique check (char_length(legacy_key) <= 20),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  in_game_name text check (char_length(in_game_name) <= 40),
  role text not null default 'Role to be confirmed' check (char_length(btrim(role)) between 1 and 60),
  jersey_number text check (jersey_number ~ '^[0-9]{1,3}$'),
  bio text check (char_length(bio) <= 1200),
  photo_url text check (public.is_asset_url(photo_url)),
  photo_path text check (char_length(photo_path) <= 300),
  photo_width integer check (photo_width between 1 and 10000),
  photo_height integer check (photo_height between 1 and 10000),
  photo_on_black boolean not null default false,
  region text check (char_length(region) <= 60),
  socials jsonb not null default '{}'::jsonb check (jsonb_typeof(socials) = 'object'),
  joined_on date,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists players_order_idx on public.players (is_active, display_order, created_at);

-- ---------------------------------------------------------------------------
-- Matches and results
-- ---------------------------------------------------------------------------

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  format text not null check (format in ('battle_royale', 'clash_squad', 'scrim', 'other')),
  -- How a result is recorded: placement table (Battle Royale) or head-to-head score.
  scoring text not null check (scoring in ('placement', 'head_to_head')),
  event_name text not null check (char_length(btrim(event_name)) between 1 and 120),
  stage text check (char_length(stage) <= 80),
  opponent text check (char_length(opponent) <= 80),
  organizer text check (char_length(organizer) <= 80),
  starts_at timestamptz not null,
  time_zone text not null default 'Asia/Dhaka' check (char_length(time_zone) between 1 and 64),
  description text check (char_length(description) <= 2000),
  cover_url text check (public.is_asset_url(cover_url)),
  cover_path text check (char_length(cover_path) <= 300),
  stream_url text check (public.is_https_url(stream_url)),
  info_url text check (public.is_https_url(info_url)),
  status text not null default 'upcoming'
    check (status in ('upcoming', 'live', 'completed', 'postponed', 'cancelled')),
  is_published boolean not null default false,
  is_featured boolean not null default false,

  -- Placement results (Battle Royale style)
  br_placement integer check (br_placement between 1 and 100),
  br_kills integer check (br_kills between 0 and 1000),
  br_placement_points numeric(8, 2) check (br_placement_points >= 0),
  br_kill_points numeric(8, 2) check (br_kill_points >= 0),
  br_total_points numeric(8, 2) check (br_total_points >= 0),
  br_rounds_played integer check (br_rounds_played between 0 and 100),

  -- Head-to-head results (Clash Squad style)
  h2h_team_score integer check (h2h_team_score between 0 and 100),
  h2h_opponent_score integer check (h2h_opponent_score between 0 and 100),
  h2h_outcome text check (h2h_outcome in ('win', 'loss', 'draw')),

  -- A result is only public once someone has explicitly confirmed it.
  result_confirmed boolean not null default false,
  completed_at timestamptz,
  result_notes text check (char_length(result_notes) <= 1000),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_by uuid references auth.users (id) on delete set null,

  constraint matches_placement_fields check (
    scoring = 'placement'
    or (br_placement is null and br_kills is null and br_placement_points is null
        and br_kill_points is null and br_total_points is null and br_rounds_played is null)
  ),
  constraint matches_h2h_fields check (
    scoring = 'head_to_head'
    or (h2h_team_score is null and h2h_opponent_score is null and h2h_outcome is null)
  ),
  constraint matches_confirmed_requires_completed check (not result_confirmed or status = 'completed'),
  constraint matches_completed_at check (status = 'completed' or completed_at is null)
);

create index if not exists matches_schedule_idx on public.matches (status, starts_at);
create index if not exists matches_public_idx on public.matches (is_published, starts_at);
create index if not exists matches_event_idx on public.matches (event_name);

create table if not exists public.match_round_results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  round_number integer not null check (round_number between 1 and 50),
  map_name text check (char_length(map_name) <= 40),
  placement integer check (placement between 1 and 100),
  kills integer check (kills between 0 and 200),
  placement_points numeric(8, 2) check (placement_points >= 0),
  kill_points numeric(8, 2) check (kill_points >= 0),
  total_points numeric(8, 2) check (total_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_by uuid references auth.users (id) on delete set null,
  unique (match_id, round_number)
);

-- ---------------------------------------------------------------------------
-- News
-- ---------------------------------------------------------------------------

create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  title text not null check (char_length(btrim(title)) between 1 and 140),
  summary text check (char_length(summary) <= 300),
  -- Restricted Markdown (headings, paragraphs, lists, links, images). Rendered with an
  -- allow-list renderer that escapes everything else.
  body text not null default '' check (char_length(body) <= 50000),
  cover_url text check (public.is_asset_url(cover_url)),
  cover_path text check (char_length(cover_path) <= 300),
  cover_alt text check (char_length(cover_alt) <= 200),
  category text not null default 'team_news' check (category in (
    'team_news', 'tournament_updates', 'match_results', 'roster_announcements', 'official_announcements'
  )),
  author_name text check (char_length(author_name) <= 80),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  -- Publication time. A published post with a future time is "scheduled".
  published_at timestamptz,
  is_featured boolean not null default false,
  seo_title text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint news_published_needs_time check (status <> 'published' or published_at is not null)
);

create index if not exists news_public_idx on public.news_posts (status, published_at desc);

-- ---------------------------------------------------------------------------
-- Partners
-- ---------------------------------------------------------------------------

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  logo_url text check (public.is_asset_url(logo_url)),
  logo_path text check (char_length(logo_path) <= 300),
  website_url text check (public.is_https_url(website_url)),
  partner_type text not null default 'partner'
    check (partner_type in ('sponsor', 'partner', 'supplier', 'media', 'other')),
  is_active boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_by uuid references auth.users (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Media library (metadata only; files live in Supabase Storage)
-- ---------------------------------------------------------------------------

create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'image' check (kind in ('image', 'video')),
  category text not null default 'team'
    check (category in ('team', 'players', 'kit', 'tournament', 'graphics', 'other')),
  collection text check (char_length(collection) <= 60),
  title text check (char_length(title) <= 120),
  caption text check (char_length(caption) <= 300),
  alt_text text check (char_length(alt_text) <= 300),
  url text check (public.is_asset_url(url)),
  storage_path text check (char_length(storage_path) <= 300),
  width integer check (width between 1 and 20000),
  height integer check (height between 1 and 20000),
  on_black boolean not null default false,
  video_url text check (public.is_https_url(video_url)),
  is_published boolean not null default false,
  is_featured boolean not null default false,
  display_order integer not null default 0,
  player_id uuid references public.players (id) on delete set null,
  news_id uuid references public.news_posts (id) on delete set null,
  match_id uuid references public.matches (id) on delete set null,
  partner_id uuid references public.partners (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint media_image_has_file check (kind <> 'image' or url is not null),
  constraint media_video_has_link check (kind <> 'video' or video_url is not null),
  constraint media_published_needs_alt check (
    not is_published or kind <> 'image' or char_length(btrim(coalesce(alt_text, ''))) > 0
  )
);

create index if not exists media_public_idx on public.media_items (is_published, display_order);

-- ---------------------------------------------------------------------------
-- Site settings (single row)
-- ---------------------------------------------------------------------------

create table if not exists public.team_settings (
  id smallint primary key default 1 check (id = 1),
  team_name text not null default 'Epic Elites' check (char_length(btrim(team_name)) between 1 and 80),
  game text not null default 'Free Fire' check (char_length(btrim(game)) between 1 and 60),
  tagline text check (char_length(tagline) <= 80),
  description text check (char_length(description) <= 400),
  contact_email text check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  site_url text check (site_url is null or site_url ~* '^https?://[^\s/]+$'),
  location text check (char_length(location) <= 80),
  facebook_url text check (public.is_https_url(facebook_url)),
  instagram_url text check (public.is_https_url(instagram_url)),
  youtube_url text check (public.is_https_url(youtube_url)),
  tiktok_url text check (public.is_https_url(tiktok_url)),
  discord_url text check (public.is_https_url(discord_url)),
  logo_url text not null default '/images/epic-elites-mark.webp' check (public.is_asset_url(logo_url)),
  favicon_url text not null default '/images/epic-elites-mark.webp' check (public.is_asset_url(favicon_url)),
  og_image_url text not null default '/images/team-kit.webp' check (public.is_asset_url(og_image_url)),
  jersey_front_url text not null default '/images/jersey-front.webp' check (public.is_asset_url(jersey_front_url)),
  jersey_back_url text not null default '/images/jersey-back.webp' check (public.is_asset_url(jersey_back_url)),
  kit_image_url text not null default '/images/team-kit.webp' check (public.is_asset_url(kit_image_url)),
  jersey_edition_label text check (char_length(jersey_edition_label) <= 60),
  hero_subtitle text check (char_length(hero_subtitle) <= 140),
  statement text check (char_length(statement) <= 400),
  footer_description text check (char_length(footer_description) <= 200),
  about_lead text check (char_length(about_lead) <= 200),
  about_body text check (char_length(about_body) <= 1200),
  featured_match_id uuid references public.matches (id) on delete set null,
  featured_news_id uuid references public.news_posts (id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Contact inbox
-- ---------------------------------------------------------------------------

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  email text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  category text not null check (category in ('partnership', 'tournament', 'media', 'general')),
  message text not null check (char_length(btrim(message)) between 10 and 5000),
  status text not null default 'unread' check (status in ('unread', 'read', 'archived')),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  archived_at timestamptz
);

create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at desc);
create index if not exists contact_messages_email_idx on public.contact_messages (lower(email), created_at desc);

-- ---------------------------------------------------------------------------
-- Audit log (written only by triggers)
-- ---------------------------------------------------------------------------

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  actor_email text,
  action text not null,
  resource_type text not null,
  resource_id text,
  resource_label text,
  summary text
);

create index if not exists audit_logs_time_idx on public.audit_logs (occurred_at desc);
create index if not exists audit_logs_resource_idx on public.audit_logs (resource_type, resource_id);

-- ---------------------------------------------------------------------------
-- updated_at / updated_by maintenance
-- ---------------------------------------------------------------------------

drop trigger if exists admin_users_touch on public.admin_users;
create trigger admin_users_touch before update on public.admin_users
  for each row execute function public.set_updated_at();
drop trigger if exists players_touch on public.players;
create trigger players_touch before update on public.players
  for each row execute function public.set_updated_at();
drop trigger if exists matches_touch on public.matches;
create trigger matches_touch before update on public.matches
  for each row execute function public.set_updated_at();
drop trigger if exists match_round_results_touch on public.match_round_results;
create trigger match_round_results_touch before update on public.match_round_results
  for each row execute function public.set_updated_at();
drop trigger if exists news_posts_touch on public.news_posts;
create trigger news_posts_touch before update on public.news_posts
  for each row execute function public.set_updated_at();
drop trigger if exists partners_touch on public.partners;
create trigger partners_touch before update on public.partners
  for each row execute function public.set_updated_at();
drop trigger if exists media_items_touch on public.media_items;
create trigger media_items_touch before update on public.media_items
  for each row execute function public.set_updated_at();
drop trigger if exists team_settings_touch on public.team_settings;
create trigger team_settings_touch before update on public.team_settings
  for each row execute function public.set_updated_at();
