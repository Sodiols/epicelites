import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { PUBLIC_CONTENT_TAG, PUBLIC_REVALIDATE_SECONDS, supabaseKey, supabaseUrl } from "./env";

const noSession = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

/**
 * Anonymous, cookie-free client for public pages. It can only see the public_* views, so
 * nothing it fetches can contain drafts or private data, which makes its responses safe to
 * cache. Every request is tagged so admin writes can expire it immediately, and capped at
 * PUBLIC_REVALIDATE_SECONDS so time-based changes (scheduled news) appear on their own.
 */
export function createPublicClient() {
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: noSession,
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          next: { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [PUBLIC_CONTENT_TAG] },
        }),
    },
  });
}

/** Same anonymous access, never cached. Used for visitor writes such as contact submissions. */
export function createAnonClient() {
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: noSession,
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
