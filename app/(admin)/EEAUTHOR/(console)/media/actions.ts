"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize, type ActionResult } from "@/lib/auth/admin";
import { refreshPublicSite } from "@/lib/admin/revalidate";
import { removeStorageObjects } from "@/lib/admin/storage";
import { MEDIA_BUCKET, supabaseUrl } from "@/lib/supabase/env";
import { assetUrl, checkbox, fieldErrors, formToObject, optionalHttpsUrl, optionalInt, optionalText, uuid } from "@/lib/validations/common";
import { youTubeId } from "@/lib/video";

const DB_ERROR = "The database rejected the change. Reload the page and try again.";
const CATEGORY = z.enum(["team", "players", "kit", "tournament", "graphics", "other"]);

function done(message: string, id?: string): ActionResult<{ id: string }> {
  refreshPublicSite();
  revalidatePath("/EEAUTHOR", "layout");
  return { ok: true, message, data: id ? { id } : undefined };
}

const uploaded = z.object({
  url: z.string().url(),
  path: z.string().min(1).max(300),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  name: z.string().max(200),
});

/**
 * Registers files that the upload route has already stored. Only URLs inside this
 * project's media bucket are accepted, so a crafted request cannot point the gallery at
 * someone else's server. New items start unpublished, so alt text can be added first.
 */
export async function registerUploads(items: z.input<typeof uploaded>[], category: string): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  const parsed = z.array(uploaded).min(1).max(50).safeParse(items);
  const cat = CATEGORY.safeParse(category);
  if (!parsed.success || !cat.success) return { ok: false, message: "Invalid upload data." };
  const prefix = `${supabaseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/`;
  if (parsed.data.some((i) => !i.url.startsWith(prefix) || !i.url.endsWith(i.path))) {
    return { ok: false, message: "Unrecognised file location." };
  }

  const db = auth.admin.supabase;
  const { data: last } = await db.from("media_items").select("display_order").order("display_order", { ascending: false }).limit(1).maybeSingle();
  const start = (last?.display_order ?? 0) + 1;
  const { error } = await db.from("media_items").insert(
    parsed.data.map((i, n) => ({
      kind: "image" as const,
      category: cat.data,
      title: i.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").slice(0, 120) || null,
      url: i.url,
      storage_path: i.path,
      width: i.width,
      height: i.height,
      is_published: false,
      display_order: start + n,
    })),
  );
  if (error) {
    await removeStorageObjects(auth.admin, parsed.data.map((i) => i.path));
    return { ok: false, message: DB_ERROR };
  }
  return done(`${parsed.data.length} ${parsed.data.length === 1 ? "image" : "images"} added as drafts. Add alt text, then publish.`);
}

const mediaSchema = z.object({
  kind: z.enum(["image", "video"]),
  category: CATEGORY,
  collection: optionalText(60),
  title: optionalText(120),
  caption: optionalText(300),
  alt_text: optionalText(300),
  video_url: optionalHttpsUrl,
  is_published: checkbox,
  is_featured: checkbox,
  on_black: checkbox,
  player_id: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || uuid.safeParse(v).success, "Choose a player from the list."),
  file_url: assetUrl.optional().transform((v) => v ?? null),
  file_path: optionalText(300),
  file_width: optionalInt(1, 20000),
  file_height: optionalInt(1, 20000),
});

export async function saveMedia(form: FormData): Promise<ActionResult<{ id: string }>> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  const raw = formToObject(form);
  const parsed = mediaSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;

  if (v.kind === "video" && (!v.video_url || !youTubeId(v.video_url))) {
    return { ok: false, message: "Use a YouTube link.", fieldErrors: { video_url: "Paste a YouTube video link (youtube.com or youtu.be)." } };
  }
  if (v.kind === "image" && !v.file_url) return { ok: false, message: "Choose an image.", fieldErrors: { file_url: "An image item needs a file." } };
  if (v.is_published && v.kind === "image" && !v.alt_text) {
    return { ok: false, message: "Published images need alt text.", fieldErrors: { alt_text: "Describe the image before publishing it." } };
  }

  const values = {
    kind: v.kind,
    category: v.category,
    collection: v.collection,
    title: v.title,
    caption: v.caption,
    alt_text: v.alt_text,
    video_url: v.kind === "video" ? v.video_url : null,
    is_published: v.is_published,
    is_featured: v.is_featured,
    on_black: v.on_black,
    player_id: v.player_id,
    url: v.file_url,
    storage_path: v.file_path,
    width: v.file_width,
    height: v.file_height,
  };

  const db = auth.admin.supabase;
  if (raw.id) {
    if (!uuid.safeParse(raw.id).success) return { ok: false, message: "Unknown media item." };
    const { data: before } = await db.from("media_items").select("storage_path").eq("id", raw.id).maybeSingle();
    const { error } = await db.from("media_items").update(values).eq("id", raw.id);
    if (error) return { ok: false, message: DB_ERROR };
    if (before?.storage_path && before.storage_path !== v.file_path) await removeStorageObjects(auth.admin, [before.storage_path]);
    return done("Media saved", raw.id);
  }
  const { data, error } = await db.from("media_items").insert(values).select("id").single();
  if (error || !data) return { ok: false, message: DB_ERROR };
  return done(v.kind === "video" ? "Video added" : "Media added", data.id);
}

export async function setMediaPublished(id: string, published: boolean): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  if (!uuid.safeParse(id).success) return { ok: false, message: "Unknown media item." };
  const { error } = await auth.admin.supabase.from("media_items").update({ is_published: published }).eq("id", id);
  if (error) {
    return {
      ok: false,
      message: error.message.includes("media_published_needs_alt") ? "Add alt text before publishing this image." : DB_ERROR,
    };
  }
  return done(published ? "Published to the gallery" : "Removed from the gallery");
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  if (!uuid.safeParse(id).success) return { ok: false, message: "Unknown media item." };
  const db = auth.admin.supabase;
  const { data: before } = await db.from("media_items").select("storage_path").eq("id", id).maybeSingle();
  const { error } = await db.from("media_items").delete().eq("id", id);
  if (error) return { ok: false, message: DB_ERROR };
  await removeStorageObjects(auth.admin, [before?.storage_path]);
  return done("Media deleted");
}

export async function reorderMedia(ids: string[]): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  const parsed = z.array(uuid).max(1000).safeParse(ids);
  if (!parsed.success) return { ok: false, message: "Invalid order." };
  const db = auth.admin.supabase;
  const results = await Promise.all(parsed.data.map((id, i) => db.from("media_items").update({ display_order: i + 1 }).eq("id", id)));
  if (results.some((r) => r.error)) return { ok: false, message: DB_ERROR };
  return done("Gallery order saved");
}
