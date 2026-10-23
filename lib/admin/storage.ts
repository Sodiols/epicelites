import "server-only";
import type { ActiveAdmin } from "@/lib/auth/admin";
import { MEDIA_BUCKET } from "@/lib/supabase/env";

/**
 * Removes Storage objects that a record no longer references (a replaced photo, a deleted
 * media item). Files shipped with the site (/images/...) have no storage path and are never
 * touched. Failure is logged, not fatal: the database change already succeeded.
 */
export async function removeStorageObjects(admin: ActiveAdmin, paths: (string | null | undefined)[]) {
  const targets = paths.filter((p): p is string => typeof p === "string" && p.length > 0);
  if (targets.length === 0) return;
  const { error } = await admin.supabase.storage.from(MEDIA_BUCKET).remove(targets);
  if (error) console.error("storage cleanup failed", error.message);
}

/** Storage path for a URL produced by our upload route, or null for local/external images. */
export function storagePathFromUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}
