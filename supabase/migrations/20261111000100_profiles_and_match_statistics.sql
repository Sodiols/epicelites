alter table public.players
  add column if not exists achievements text check (char_length(achievements) <= 1200),
  add column if not exists competitive_history text check (char_length(competitive_history) <= 1600);

alter table public.matches
  add column if not exists player_statistics jsonb not null default '[]'::jsonb
    check (jsonb_typeof(player_statistics) = 'array' and jsonb_array_length(player_statistics) <= 24);

create or replace view public.public_player_details with (security_barrier = true) as
select p.id, p.achievements, p.competitive_history
from public.players p
where p.is_active;

create or replace view public.public_match_statistics with (security_barrier = true) as
select m.id, m.player_statistics
from public.matches m
where m.is_published and m.status = 'completed' and m.result_confirmed;

revoke all on public.public_player_details, public.public_match_statistics from public;
grant select on public.public_player_details, public.public_match_statistics to anon, authenticated;

-- Keep the confirmed result, player stats and its round rows in one transaction.
-- The caller's existing match and round write policies still apply.
create or replace function public.save_match_result(
  p_id uuid, p_scoring text, p_result jsonb, p_rounds jsonb, p_confirm boolean
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.matches m
  set status = 'completed',
      completed_at = coalesce(m.completed_at, now()),
      result_confirmed = p_confirm,
      is_published = p_confirm or m.is_published,
      result_notes = r.result_notes,
      player_statistics = r.player_statistics,
      br_placement = r.br_placement,
      br_kills = r.br_kills,
      br_placement_points = r.br_placement_points,
      br_kill_points = r.br_kill_points,
      br_total_points = r.br_total_points,
      br_rounds_played = r.br_rounds_played,
      h2h_team_score = r.h2h_team_score,
      h2h_opponent_score = r.h2h_opponent_score,
      h2h_outcome = r.h2h_outcome
  from jsonb_populate_record(null::public.matches, p_result) r
  where m.id = p_id and m.scoring = p_scoring;

  if not found then
    raise exception 'Match not found or scoring has changed.';
  end if;

  if p_scoring = 'placement' then
    delete from public.match_round_results existing
    where existing.match_id = p_id and not exists (
      select 1 from jsonb_populate_recordset(null::public.match_round_results, p_rounds) r
      where r.round_number = existing.round_number
    );

    insert into public.match_round_results
      (match_id, round_number, map_name, placement, kills, placement_points, kill_points, total_points)
    select p_id, r.round_number, r.map_name, r.placement, r.kills, r.placement_points, r.kill_points, r.total_points
    from jsonb_populate_recordset(null::public.match_round_results, p_rounds) r
    on conflict (match_id, round_number) do update
    set map_name = excluded.map_name, placement = excluded.placement, kills = excluded.kills,
        placement_points = excluded.placement_points, kill_points = excluded.kill_points,
        total_points = excluded.total_points;
  end if;
end;
$$;

revoke all on function public.save_match_result(uuid, text, jsonb, jsonb, boolean) from public, anon;
grant execute on function public.save_match_result(uuid, text, jsonb, jsonb, boolean) to authenticated;
