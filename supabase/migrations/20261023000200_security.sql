-- Epic Elites CMS: authorization, Row Level Security, grants and public read views.
-- Safe to run more than once.
--
-- Model:
--   * anon (visitors) has NO privileges on any base table. It can only select from the
--     public_* views below, which expose published rows and public columns only, and
--     call submit_contact_message().
--   * authenticated users pass RLS only if they have an active row in admin_users.
--     Owners can additionally manage administrators.
--   * audit_logs is append-only and written exclusively by trigger functions.

-- ---------------------------------------------------------------------------
-- Authorization helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid()) and a.is_active
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid()) and a.is_active and a.role = 'owner'
  );
$$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_owner() to authenticated;

-- Never leave the site without an active owner.
create or replace function public.guard_last_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining integer;
begin
  if (tg_op = 'DELETE' and old.role = 'owner' and old.is_active)
     or (tg_op = 'UPDATE' and old.role = 'owner' and old.is_active
         and (new.role <> 'owner' or not new.is_active)) then
    select count(*) into remaining
    from public.admin_users
    where role = 'owner' and is_active and user_id <> old.user_id;
    if remaining = 0 then
      raise exception 'The last active owner cannot be removed, disabled or demoted.'
        using errcode = 'P0001', hint = 'last_owner';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists admin_users_last_owner on public.admin_users;
create trigger admin_users_last_owner
  before update or delete on public.admin_users
  for each row execute function public.guard_last_owner();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.admin_users enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_round_results enable row level security;
alter table public.news_posts enable row level security;
alter table public.partners enable row level security;
alter table public.media_items enable row level security;
alter table public.team_settings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_logs enable row level security;

-- Content tables: active administrators (owner or editor) have full CRUD.
do $$
declare
  t text;
begin
  foreach t in array array['players', 'matches', 'match_round_results', 'news_posts', 'partners', 'media_items']
  loop
    execute format('drop policy if exists "admins select %1$s" on public.%1$I', t);
    execute format('drop policy if exists "admins insert %1$s" on public.%1$I', t);
    execute format('drop policy if exists "admins update %1$s" on public.%1$I', t);
    execute format('drop policy if exists "admins delete %1$s" on public.%1$I', t);
    execute format('create policy "admins select %1$s" on public.%1$I for select to authenticated using ((select public.is_admin()))', t);
    execute format('create policy "admins insert %1$s" on public.%1$I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format('create policy "admins update %1$s" on public.%1$I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('create policy "admins delete %1$s" on public.%1$I for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
end;
$$;

-- Settings: one row, readable and editable by administrators, never inserted or deleted by them.
drop policy if exists "admins select settings" on public.team_settings;
create policy "admins select settings" on public.team_settings
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "admins update settings" on public.team_settings;
create policy "admins update settings" on public.team_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Inbox: administrators read, triage and delete. Inserts happen only through submit_contact_message().
drop policy if exists "admins select messages" on public.contact_messages;
create policy "admins select messages" on public.contact_messages
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "admins update messages" on public.contact_messages;
create policy "admins update messages" on public.contact_messages
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "admins delete messages" on public.contact_messages;
create policy "admins delete messages" on public.contact_messages
  for delete to authenticated using ((select public.is_admin()));

-- Audit log: readable by administrators. No insert/update/delete policy exists, so it cannot be
-- written or erased through the API by anyone; only SECURITY DEFINER triggers append to it.
drop policy if exists "admins select audit" on public.audit_logs;
create policy "admins select audit" on public.audit_logs
  for select to authenticated using ((select public.is_admin()));

-- Administrators: everyone can see their own row (so the app can check its role);
-- owners see and manage everyone.
drop policy if exists "read own or owner reads all" on public.admin_users;
create policy "read own or owner reads all" on public.admin_users
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_owner()));
drop policy if exists "owners insert admins" on public.admin_users;
create policy "owners insert admins" on public.admin_users
  for insert to authenticated with check ((select public.is_owner()));
drop policy if exists "owners update admins" on public.admin_users;
create policy "owners update admins" on public.admin_users
  for update to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
drop policy if exists "owners delete admins" on public.admin_users;
create policy "owners delete admins" on public.admin_users
  for delete to authenticated using ((select public.is_owner()));

-- ---------------------------------------------------------------------------
-- Grants. Supabase grants broad default privileges on new tables; tighten them.
-- ---------------------------------------------------------------------------

revoke all on table
  public.admin_users, public.players, public.matches, public.match_round_results,
  public.news_posts, public.partners, public.media_items, public.team_settings,
  public.contact_messages, public.audit_logs
from anon, authenticated;

grant select, insert, update, delete on table
  public.players, public.matches, public.match_round_results,
  public.news_posts, public.partners, public.media_items
to authenticated;

grant select, update on table public.team_settings to authenticated;
grant select, update, delete on table public.contact_messages to authenticated;
grant select on table public.audit_logs to authenticated;
grant select, insert, update, delete on table public.admin_users to authenticated;

-- ---------------------------------------------------------------------------
-- Public read views. Owned by the migration role, so they read the base tables
-- regardless of RLS; every filter that makes a row "public" lives here.
-- ---------------------------------------------------------------------------

create or replace view public.public_settings with (security_barrier = true) as
select
  team_name, game, tagline, description, contact_email, site_url, location,
  facebook_url, instagram_url, youtube_url, tiktok_url, discord_url,
  logo_url, favicon_url, og_image_url, jersey_front_url, jersey_back_url, kit_image_url,
  jersey_edition_label, hero_subtitle, statement, footer_description, about_lead, about_body,
  featured_match_id, featured_news_id, updated_at
from public.team_settings
where id = 1;

create or replace view public.public_players with (security_barrier = true) as
select
  id, slug, legacy_key, display_name, in_game_name, role, jersey_number, bio,
  photo_url, photo_width, photo_height, photo_on_black, region, socials, joined_on,
  is_featured, display_order
from public.players
where is_active;

-- Result columns are blanked until a result has been confirmed.
create or replace view public.public_matches with (security_barrier = true) as
select
  m.id, m.format, m.scoring, m.event_name, m.stage, m.opponent, m.organizer,
  m.starts_at, m.time_zone, m.description, m.cover_url, m.stream_url, m.info_url,
  m.status, m.is_featured,
  case when m.result_confirmed then m.br_placement end as br_placement,
  case when m.result_confirmed then m.br_kills end as br_kills,
  case when m.result_confirmed then m.br_placement_points end as br_placement_points,
  case when m.result_confirmed then m.br_kill_points end as br_kill_points,
  case when m.result_confirmed then m.br_total_points end as br_total_points,
  case when m.result_confirmed then m.br_rounds_played end as br_rounds_played,
  case when m.result_confirmed then m.h2h_team_score end as h2h_team_score,
  case when m.result_confirmed then m.h2h_opponent_score end as h2h_opponent_score,
  case when m.result_confirmed then m.h2h_outcome end as h2h_outcome,
  m.result_confirmed,
  case when m.result_confirmed then m.completed_at end as completed_at
from public.matches m
where m.is_published;

create or replace view public.public_match_rounds with (security_barrier = true) as
select r.id, r.match_id, r.round_number, r.map_name, r.placement, r.kills,
       r.placement_points, r.kill_points, r.total_points
from public.match_round_results r
join public.matches m on m.id = r.match_id
where m.is_published and m.result_confirmed;

-- Scheduled posts become visible the moment published_at passes; now() is evaluated per query.
create or replace view public.public_news with (security_barrier = true) as
select
  id, slug, title, summary, body, cover_url, cover_alt, category, author_name,
  published_at, updated_at, is_featured, seo_title, seo_description
from public.news_posts
where status = 'published' and published_at <= now();

create or replace view public.public_media with (security_barrier = true) as
select
  mi.id, mi.kind, mi.category, mi.collection, mi.title,
  coalesce(nullif(btrim(mi.caption), ''), p.display_name) as caption,
  mi.alt_text, mi.url, mi.width, mi.height, mi.on_black, mi.video_url,
  mi.is_featured, mi.display_order, mi.created_at
from public.media_items mi
left join public.players p on p.id = mi.player_id
where mi.is_published;

create or replace view public.public_partners with (security_barrier = true) as
select id, name, logo_url, website_url, partner_type, display_order
from public.partners
where is_active;

revoke all on
  public.public_settings, public.public_players, public.public_matches,
  public.public_match_rounds, public.public_news, public.public_media, public.public_partners
from public;
grant select on
  public.public_settings, public.public_players, public.public_matches,
  public.public_match_rounds, public.public_news, public.public_media, public.public_partners
to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public contact form submission
-- ---------------------------------------------------------------------------

create or replace function public.submit_contact_message(
  p_name text, p_email text, p_category text, p_message text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_email text := lower(btrim(p_email));
begin
  if char_length(coalesce(p_message, '')) > 5000 or char_length(coalesce(p_name, '')) > 100 then
    raise exception 'payload_too_large' using errcode = '22001';
  end if;

  -- Per-sender and site-wide throttles. The web server applies its own per-IP limit too.
  if (select count(*) from public.contact_messages
      where lower(email) = v_email and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'rate_limited' using errcode = 'P0001', hint = 'rate_limited';
  end if;
  if (select count(*) from public.contact_messages
      where created_at > now() - interval '10 minutes') >= 40 then
    raise exception 'rate_limited' using errcode = 'P0001', hint = 'rate_limited';
  end if;

  insert into public.contact_messages (name, email, category, message)
  values (btrim(p_name), v_email, p_category, btrim(p_message))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.submit_contact_message(text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Owner-only administrator management (needs auth.users lookups, so SECURITY DEFINER)
-- ---------------------------------------------------------------------------

-- Grants dashboard access to someone who already has a Supabase Auth account.
create or replace function public.admin_grant_access(p_email text, p_role text, p_display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_email text;
begin
  if not public.is_owner() then
    raise exception 'Only an owner can manage administrators.' using errcode = '42501';
  end if;
  if p_role not in ('owner', 'editor') then
    raise exception 'Unknown role.' using errcode = '22023';
  end if;

  select u.id, u.email into v_user, v_email
  from auth.users u
  where lower(u.email) = lower(btrim(p_email))
  limit 1;

  if v_user is null then
    raise exception 'No account exists for that email.' using errcode = 'P0002', hint = 'no_user';
  end if;

  insert into public.admin_users (user_id, email, display_name, role, is_active, created_by)
  values (v_user, v_email, nullif(btrim(p_display_name), ''), p_role, true, auth.uid())
  on conflict (user_id) do update
    set role = excluded.role,
        is_active = true,
        email = excluded.email,
        display_name = coalesce(excluded.display_name, public.admin_users.display_name);

  return v_user;
end;
$$;

revoke all on function public.admin_grant_access(text, text, text) from public, anon;
grant execute on function public.admin_grant_access(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- First-owner bootstrap. Run from the SQL editor (as postgres) once, after creating the
-- user in Supabase Auth. Not callable through the API.
-- ---------------------------------------------------------------------------

create or replace function public.bootstrap_owner(p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_email text;
begin
  if exists (select 1 from public.admin_users where role = 'owner' and is_active) then
    raise exception 'An active owner already exists. Add more administrators from the dashboard.';
  end if;
  select u.id, u.email into v_user, v_email from auth.users u where lower(u.email) = lower(btrim(p_email));
  if v_user is null then
    raise exception 'Create this user in Authentication > Users first.';
  end if;
  insert into public.admin_users (user_id, email, role, is_active)
  values (v_user, v_email, 'owner', true)
  on conflict (user_id) do update set role = 'owner', is_active = true;
  return v_user;
end;
$$;

revoke all on function public.bootstrap_owner(text) from public, anon, authenticated;
