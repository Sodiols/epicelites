"use server";

import { revalidatePath } from "next/cache";
import { authorize, type ActionResult } from "@/lib/auth/admin";
import { refreshPublicSite } from "@/lib/admin/revalidate";
import { removeStorageObjects } from "@/lib/admin/storage";
import { fieldErrors, formToObject, uuid } from "@/lib/validations/common";
import { headToHeadResultSchema, matchSchema, parseRounds, placementResultSchema } from "@/lib/validations/match";
import type { MatchStatus } from "@/lib/supabase/types";

const DB_ERROR = "The database rejected the change. Reload the page and try again.";

function done(message: string, id?: string): ActionResult<{ id: string }> {
  refreshPublicSite();
  revalidatePath("/EEAUTHOR", "layout");
  return { ok: true, message, data: id ? { id } : undefined };
}

/** Create a match, or update one in place when an id is posted (rescheduling never duplicates). */
export async function saveMatch(form: FormData): Promise<ActionResult<{ id: string }>> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  const db = auth.admin.supabase;

  const raw = formToObject(form);
  const parsed = matchSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const input = parsed.data;

  // Result fields that do not apply to the chosen scoring are cleared, so switching a
  // Clash Squad match to Battle Royale can never leave a stale score behind.
  const clearOther =
    input.scoring === "placement"
      ? { h2h_team_score: null, h2h_opponent_score: null, h2h_outcome: null }
      : {
          br_placement: null,
          br_kills: null,
          br_placement_points: null,
          br_kill_points: null,
          br_total_points: null,
          br_rounds_played: null,
        };
  const completion =
    input.status === "completed" ? {} : { result_confirmed: false, completed_at: null };

  const id = raw.id;
  if (id) {
    if (!uuid.safeParse(id).success) return { ok: false, message: "Unknown match." };
    const { data: before } = await db.from("matches").select("cover_path").eq("id", id).maybeSingle();
    const { error } = await db
      .from("matches")
      .update({ ...input, ...clearOther, ...completion })
      .eq("id", id);
    if (error) return { ok: false, message: DB_ERROR };
    if (before?.cover_path && before.cover_path !== input.cover_path) await removeStorageObjects(auth.admin, [before.cover_path]);
    return done("Match saved", id);
  }

  const { data, error } = await db.from("matches").insert({ ...input, ...clearOther }).select("id").single();
  if (error || !data) return { ok: false, message: DB_ERROR };
  return done(input.is_published ? "Match scheduled and published" : "Match saved as draft", data.id);
}

export async function setMatchStatus(id: string, status: Exclude<MatchStatus, "completed">): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  if (!uuid.safeParse(id).success) return { ok: false, message: "Unknown match." };
  const { error } = await auth.admin.supabase
    .from("matches")
    .update({ status, result_confirmed: false, completed_at: null })
    .eq("id", id);
  if (error) return { ok: false, message: DB_ERROR };
  const labels = { upcoming: "Match restored to upcoming", live: "Match marked live", postponed: "Match postponed", cancelled: "Match cancelled" };
  return done(labels[status]);
}

export async function setMatchPublished(id: string, published: boolean): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  if (!uuid.safeParse(id).success) return { ok: false, message: "Unknown match." };
  const { error } = await auth.admin.supabase.from("matches").update({ is_published: published }).eq("id", id);
  if (error) return { ok: false, message: DB_ERROR };
  return done(published ? "Match published" : "Match unpublished");
}

export async function duplicateMatch(id: string): Promise<ActionResult<{ id: string }>> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  const db = auth.admin.supabase;
  if (!uuid.safeParse(id).success) return { ok: false, message: "Unknown match." };
  const { data: m } = await db.from("matches").select("*").eq("id", id).maybeSingle();
  if (!m) return { ok: false, message: "That match no longer exists." };

  // The copy is a fresh, unpublished fixture: no result, no status history, no shared cover file.
  const { data, error } = await db
    .from("matches")
    .insert({
      format: m.format,
      scoring: m.scoring,
      event_name: m.event_name,
      stage: m.stage,
      opponent: m.opponent,
      organizer: m.organizer,
      starts_at: m.starts_at,
      time_zone: m.time_zone,
      description: m.description,
      cover_url: m.cover_path ? null : m.cover_url,
      stream_url: m.stream_url,
      info_url: m.info_url,
      status: "upcoming",
      is_published: false,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, message: DB_ERROR };
  return done("Match duplicated as a draft", data.id);
}

export async function deleteMatch(id: string): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  if (!uuid.safeParse(id).success) return { ok: false, message: "Unknown match." };
  const db = auth.admin.supabase;
  const { data: m } = await db.from("matches").select("cover_path").eq("id", id).maybeSingle();
  const { error } = await db.from("matches").delete().eq("id", id);
  if (error) return { ok: false, message: DB_ERROR };
  await removeStorageObjects(auth.admin, [m?.cover_path]);
  return done("Match deleted");
}

/**
 * Records a result on an existing match. "save" stores it as completed but unconfirmed
 * (hidden from visitors); "confirm" marks it verified and publishes it.
 */
export async function saveResult(form: FormData): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  const db = auth.admin.supabase;
  const raw = formToObject(form);
  if (!uuid.safeParse(raw.id).success) return { ok: false, message: "Unknown match." };

  const { data: match } = await db.from("matches").select("scoring, completed_at").eq("id", raw.id).maybeSingle();
  if (!match) return { ok: false, message: "That match no longer exists." };

  const intent = raw.intent === "confirm" ? "confirm" : raw.intent === "unconfirm" ? "unconfirm" : "save";
  const schema = match.scoring === "placement" ? placementResultSchema : headToHeadResultSchema;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };

  const { rounds, error: roundError } = match.scoring === "placement" ? parseRounds(form) : { rounds: [], error: null };
  if (roundError) return { ok: false, message: roundError };

  const values = parsed.data as Record<string, unknown>;
  const hasResult = Object.entries(values).some(([k, v]) => k !== "result_notes" && v !== null);
  if (intent === "confirm" && !hasResult && rounds.length === 0) {
    return { ok: false, message: "Enter at least one result figure before confirming." };
  }

  const { error } = await db
    .from("matches")
    .update({
      ...values,
      status: "completed",
      completed_at: match.completed_at ?? new Date().toISOString(),
      result_confirmed: intent === "confirm",
      ...(intent === "confirm" ? { is_published: true } : {}),
    })
    .eq("id", raw.id);
  if (error) return { ok: false, message: DB_ERROR };

  if (match.scoring === "placement") {
    const keep = rounds.map((r) => r.round_number);
    const del = db.from("match_round_results").delete().eq("match_id", raw.id);
    const { error: delError } = keep.length ? await del.not("round_number", "in", `(${keep.join(",")})`) : await del;
    if (delError) return { ok: false, message: DB_ERROR };
    if (rounds.length) {
      const { error: upError } = await db
        .from("match_round_results")
        .upsert(rounds.map((r) => ({ ...r, match_id: raw.id })), { onConflict: "match_id,round_number" });
      if (upError) return { ok: false, message: DB_ERROR };
    }
  }

  return done(
    intent === "confirm"
      ? "Result confirmed and published"
      : intent === "unconfirm"
        ? "Result hidden until it is confirmed again"
        : "Result saved, not yet public",
  );
}
