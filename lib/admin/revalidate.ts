import "server-only";
import { revalidatePath, updateTag } from "next/cache";
import { PUBLIC_CONTENT_TAG } from "@/lib/supabase/env";

/**
 * Called after every successful admin write. updateTag expires all cached public Supabase
 * reads immediately (the next visitor gets fresh data), and revalidatePath drops the
 * prerendered public pages that were built from them. Only valid inside Server Actions.
 */
export function refreshPublicSite() {
  updateTag(PUBLIC_CONTENT_TAG);
  revalidatePath("/", "layout");
}
