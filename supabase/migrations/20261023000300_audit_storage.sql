-- Epic Elites CMS: audit trail, Storage bucket and policies, realtime inbox.
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Audit trail
-- ---------------------------------------------------------------------------
-- Each change records who did it, which record, and which fields changed. Small
-- enumerated fields (status, role, publication flags) include their before/after values;
-- free text (bios, article bodies, message contents) is never copied into the log.

create or replace function public.audit_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_changed text[];
  v_details text[];
  v_key text;
  v_label text;
  v_summary text;
  v_actor uuid := auth.uid();
  v_tracked constant text[] := array[
    'status', 'is_published', 'is_active', 'is_featured', 'role', 'result_confirmed',
    'jersey_number', 'published_at', 'starts_at', 'time_zone', 'format', 'display_order'
  ];
begin
  if tg_table_name = 'contact_messages' then
    v_label := 'Inquiry (' || coalesce(v_row ->> 'category', 'general') || ')';
  else
    v_label := coalesce(
      v_row ->> 'display_name', v_row ->> 'title', v_row ->> 'event_name',
      v_row ->> 'name', v_row ->> 'team_name', v_row ->> 'email',
      case when v_row ? 'round_number' then 'Round ' || (v_row ->> 'round_number') end
    );
  end if;

  if tg_op = 'UPDATE' then
    select array_agg(n.key order by n.key) into v_changed
    from jsonb_each(v_new) n
    where n.value is distinct from v_old -> n.key
      and n.key not in ('updated_at', 'updated_by', 'created_at', 'created_by', 'read_at', 'archived_at');

    if v_changed is null then
      return new;
    end if;

    v_details := array[]::text[];
    foreach v_key in array v_changed loop
      if v_key = any (v_tracked) then
        v_details := v_details || format('%s: %s to %s', v_key,
          coalesce(v_old ->> v_key, 'empty'), coalesce(v_new ->> v_key, 'empty'));
      else
        v_details := v_details || v_key;
      end if;
    end loop;
    v_summary := 'Changed ' || array_to_string(v_details, ', ');
  elsif tg_op = 'INSERT' then
    v_summary := 'Created';
  else
    v_summary := 'Deleted';
  end if;

  insert into public.audit_logs (actor_id, actor_email, action, resource_type, resource_id, resource_label, summary)
  values (
    v_actor,
    (select u.email from auth.users u where u.id = v_actor),
    lower(tg_op),
    tg_table_name,
    coalesce(v_row ->> 'id', v_row ->> 'user_id'),
    left(v_label, 140),
    left(v_summary, 1000)
  );

  return coalesce(new, old);
end;
$$;

revoke all on function public.audit_change() from public, anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'admin_users', 'players', 'matches', 'match_round_results', 'news_posts',
    'partners', 'media_items', 'team_settings', 'contact_messages'
  ]
  loop
    execute format('drop trigger if exists %1$s_audit on public.%1$I', t);
    execute format(
      'create trigger %1$s_audit after insert or update or delete on public.%1$I
         for each row execute function public.audit_change()', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage: one public-read bucket for site media
-- ---------------------------------------------------------------------------
-- Public buckets serve files by URL without a policy check, which is what lets
-- next/image and CDNs cache them. Nothing can be listed, uploaded, replaced or deleted
-- without passing the admin policies below. Uploads are re-encoded to WebP server-side
-- and stored under random UUID paths, so unpublished files cannot be discovered.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins read media objects" on storage.objects;
create policy "admins read media objects" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

drop policy if exists "admins upload media objects" on storage.objects;
create policy "admins upload media objects" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));

drop policy if exists "admins update media objects" on storage.objects;
create policy "admins update media objects" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()))
  with check (bucket_id = 'media' and (select public.is_admin()));

drop policy if exists "admins delete media objects" on storage.objects;
create policy "admins delete media objects" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Realtime: new inquiries appear in the dashboard without a refresh.
-- Realtime respects RLS, so only administrators receive these rows.
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'contact_messages'
     ) then
    alter publication supabase_realtime add table public.contact_messages;
  end if;
end;
$$;
