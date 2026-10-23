"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize, type ActionResult } from "@/lib/auth/admin";
import { refreshPublicSite } from "@/lib/admin/revalidate";
import { removeStorageObjects } from "@/lib/admin/storage";
import { fieldErrors, formToObject, uuid } from "@/lib/validations/common";
import { playerSchema } from "@/lib/validations/player";

const DB_ERROR = "The database rejected the change. Reload the page and try again.";

function done(message: string, id?: string): ActionResult<{ id: string }> {
  refreshPublicSite();
  revalidatePath("/EEAUTHOR", "layout");
  return { ok: true, message, data: id ? { id } : undefined };
}

export async function savePlayer(form: FormData): Promise<ActionResult<{ id: string }>> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  const db = auth.admin.supabase;
  const raw = formToObject(form);
  const parsed = playerSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const input = parsed.data;

  const { data: clash } = await db.from("players").select("id").eq("slug", input.slug).neq("id", raw.id || "00000000-0000-0000-0000-000000000000").maybeSingle();
  if (clash) return { ok: false, message: "Another player already uses that link name.", fieldErrors: { slug: "Choose a different link name." } };

  if (raw.id) {
    if (!uuid.safeParse(raw.id).success) return { ok: false, message: "Unknown player." };
    const { data: before } = await db.from("players").select("photo_path").eq("id", raw.id).maybeSingle();
    const { error } = await db.from("players").update(input).eq("id", raw.id);
    if (error) return { ok: false, message: DB_ERROR };
    if (before?.photo_path && before.photo_path !== input.photo_path) await removeStorageObjects(auth.admin, [before.photo_path]);
    return done("Player saved", raw.id);
  }

  const { data: last } = await db.from("players").select("display_order").order("display_order", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await db
    .from("players")
    .insert({ ...input, display_order: (last?.display_order ?? 0) + 1 })
    .select("id")
    .single();
  if (error || !data) return { ok: false, message: DB_ERROR };
  return done("Player added", data.id);
}

export async function setPlayerActive(id: string, active: boolean): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  if (!uuid.safeParse(id).success) return { ok: false, message: "Unknown player." };
  const { error } = await auth.admin.supabase.from("players").update({ is_active: active }).eq("id", id);
  if (error) return { ok: false, message: DB_ERROR };
  return done(active ? "Player restored to the roster" : "Player marked inactive and hidden from the website");
}

export async function deletePlayer(id: string): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  if (!uuid.safeParse(id).success) return { ok: false, message: "Unknown player." };
  const db = auth.admin.supabase;
  const { data: before } = await db.from("players").select("photo_path").eq("id", id).maybeSingle();
  const { error } = await db.from("players").delete().eq("id", id);
  if (error) return { ok: false, message: DB_ERROR };
  await removeStorageObjects(auth.admin, [before?.photo_path]);
  return done("Player removed");
}

/** Saves a new display order. Every id must be a real player; order is the array order. */
export async function reorderPlayers(ids: string[]): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  const parsed = z.array(uuid).max(200).safeParse(ids);
  if (!parsed.success) return { ok: false, message: "Invalid order." };
  const db = auth.admin.supabase;
  const results = await Promise.all(parsed.data.map((id, i) => db.from("players").update({ display_order: i + 1 }).eq("id", id)));
  if (results.some((r) => r.error)) return { ok: false, message: DB_ERROR };
  return done("Roster order saved");
}
