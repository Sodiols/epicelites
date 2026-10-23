"use server";

import { revalidatePath } from "next/cache";
import { authorize, type ActionResult } from "@/lib/auth/admin";
import { refreshPublicSite } from "@/lib/admin/revalidate";
import { removeStorageObjects } from "@/lib/admin/storage";
import { fieldErrors, formToObject, uuid } from "@/lib/validations/common";
import { newsSchema } from "@/lib/validations/news";
import { DEFAULT_TIME_ZONE, zonedInputToUtc } from "@/lib/time";

const DB_ERROR = "The database rejected the change. Reload the page and try again.";

function done(message: string, id?: string): ActionResult<{ id: string }> {
  refreshPublicSite();
  revalidatePath("/EEAUTHOR", "layout");
  return { ok: true, message, data: id ? { id } : undefined };
}

/**
 * One action for every editorial button:
 *   draft    save privately (status draft)
 *   publish  publish now
 *   schedule publish at a future moment (visible automatically once it passes)
 *   update   save edits to a published or scheduled article, keeping its state
 */
export async function saveNews(form: FormData): Promise<ActionResult<{ id: string }>> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  const db = auth.admin.supabase;
  const raw = formToObject(form);
  const parsed = newsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const { intent, publish_local, publish_tz, ...input } = parsed.data;

  const id = raw.id || null;
  if (id && !uuid.safeParse(id).success) return { ok: false, message: "Unknown article." };
  const { data: existing } = id
    ? await db.from("news_posts").select("status, published_at, cover_path").eq("id", id).maybeSingle()
    : { data: null };
  if (id && !existing) return { ok: false, message: "That article no longer exists." };

  const { data: clash } = await db.from("news_posts").select("id").eq("slug", input.slug).neq("id", id ?? "00000000-0000-0000-0000-000000000000").maybeSingle();
  if (clash) return { ok: false, message: "Another article already uses that URL.", fieldErrors: { slug: "Choose a different URL slug." } };

  if ((intent === "publish" || intent === "schedule") && input.body.trim().length < 20) {
    return { ok: false, message: "Write the article before publishing.", fieldErrors: { body: "The article body is empty or too short." } };
  }
  if (input.cover_url && !input.cover_alt) {
    return { ok: false, message: "Describe the cover image.", fieldErrors: { cover_alt: "Alt text is required when there is a cover image." } };
  }

  let status = existing?.status ?? "draft";
  let publishedAt = existing?.published_at ?? null;
  const now = new Date();

  if (intent === "draft") {
    status = "draft";
  } else if (intent === "publish") {
    status = "published";
    publishedAt = publishedAt && new Date(publishedAt) <= now ? publishedAt : now.toISOString();
  } else if (intent === "schedule") {
    const at = publish_local ? zonedInputToUtc(publish_local, publish_tz ?? DEFAULT_TIME_ZONE) : null;
    if (!at) return { ok: false, message: "Choose when to publish.", fieldErrors: { publish_local: "Choose a date and time." } };
    if (at <= now) return { ok: false, message: "Scheduled time must be in the future.", fieldErrors: { publish_local: "Pick a future time, or use Publish now." } };
    status = "published";
    publishedAt = at.toISOString();
  }

  const values = { ...input, status, published_at: publishedAt };
  const message =
    intent === "draft"
      ? "Draft saved"
      : intent === "publish"
        ? "Article published"
        : intent === "schedule"
          ? "Article scheduled"
          : "Article updated";

  if (id) {
    const { error } = await db.from("news_posts").update(values).eq("id", id);
    if (error) return { ok: false, message: DB_ERROR };
    if (existing?.cover_path && existing.cover_path !== input.cover_path) await removeStorageObjects(auth.admin, [existing.cover_path]);
    return done(message, id);
  }
  const { data, error } = await db.from("news_posts").insert(values).select("id").single();
  if (error || !data) return { ok: false, message: DB_ERROR };
  return done(message, data.id);
}

export async function setNewsStatus(id: string, status: "draft" | "archived"): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  if (!uuid.safeParse(id).success) return { ok: false, message: "Unknown article." };
  const { error } = await auth.admin.supabase.from("news_posts").update({ status }).eq("id", id);
  if (error) return { ok: false, message: DB_ERROR };
  return done(status === "draft" ? "Article unpublished and moved to drafts" : "Article archived");
}

export async function deleteNews(id: string): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  if (!uuid.safeParse(id).success) return { ok: false, message: "Unknown article." };
  const db = auth.admin.supabase;
  const { data: before } = await db.from("news_posts").select("cover_path").eq("id", id).maybeSingle();
  const { error } = await db.from("news_posts").delete().eq("id", id);
  if (error) return { ok: false, message: DB_ERROR };
  await removeStorageObjects(auth.admin, [before?.cover_path]);
  return done("Article deleted");
}
