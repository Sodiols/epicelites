"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize, type ActionResult } from "@/lib/auth/admin";
import { refreshPublicSite } from "@/lib/admin/revalidate";
import { removeStorageObjects } from "@/lib/admin/storage";
import { assetUrl, checkbox, fieldErrors, formToObject, optionalHttpsUrl, optionalText, requiredText, uuid } from "@/lib/validations/common";

const DB_ERROR = "The database rejected the change. Reload the page and try again.";

const schema = z.object({
  name: requiredText(80, "Enter the partner's name."),
  website_url: optionalHttpsUrl,
  partner_type: z.enum(["sponsor", "partner", "supplier", "media", "other"]),
  is_active: checkbox,
  logo_url: assetUrl.optional().transform((v) => v ?? null),
  logo_path: optionalText(300),
});

function done(message: string, id?: string): ActionResult<{ id: string }> {
  refreshPublicSite();
  revalidatePath("/EEAUTHOR", "layout");
  return { ok: true, message, data: id ? { id } : undefined };
}

export async function savePartner(form: FormData): Promise<ActionResult<{ id: string }>> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  const raw = formToObject(form);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const db = auth.admin.supabase;

  if (raw.id) {
    if (!uuid.safeParse(raw.id).success) return { ok: false, message: "Unknown partner." };
    const { data: before } = await db.from("partners").select("logo_path").eq("id", raw.id).maybeSingle();
    const { error } = await db.from("partners").update(parsed.data).eq("id", raw.id);
    if (error) return { ok: false, message: DB_ERROR };
    if (before?.logo_path && before.logo_path !== parsed.data.logo_path) await removeStorageObjects(auth.admin, [before.logo_path]);
    return done("Partner saved", raw.id);
  }
  const { data: last } = await db.from("partners").select("display_order").order("display_order", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await db.from("partners").insert({ ...parsed.data, display_order: (last?.display_order ?? 0) + 1 }).select("id").single();
  if (error || !data) return { ok: false, message: DB_ERROR };
  return done("Partner added", data.id);
}

export async function deletePartner(id: string): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  if (!uuid.safeParse(id).success) return { ok: false, message: "Unknown partner." };
  const db = auth.admin.supabase;
  const { data: before } = await db.from("partners").select("logo_path").eq("id", id).maybeSingle();
  const { error } = await db.from("partners").delete().eq("id", id);
  if (error) return { ok: false, message: DB_ERROR };
  await removeStorageObjects(auth.admin, [before?.logo_path]);
  return done("Partner removed");
}

export async function reorderPartners(ids: string[]): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  const parsed = z.array(uuid).max(200).safeParse(ids);
  if (!parsed.success) return { ok: false, message: "Invalid order." };
  const db = auth.admin.supabase;
  const results = await Promise.all(parsed.data.map((id, i) => db.from("partners").update({ display_order: i + 1 }).eq("id", id)));
  if (results.some((r) => r.error)) return { ok: false, message: DB_ERROR };
  return done("Partner order saved");
}
