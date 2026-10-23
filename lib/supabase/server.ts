import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";
import { supabaseKey, supabaseUrl } from "./env";
import { authCookieOptions, REMEMBER_COOKIE } from "./cookies";

/**
 * Per-request client bound to the signed-in admin's session cookies. Every query runs as
 * that user, so Row Level Security decides what it can read and change.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const remember = cookieStore.get(REMEMBER_COOKIE)?.value !== "0";

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, authCookieOptions(options, remember));
          }
        } catch {
          // Server Components cannot write cookies. The proxy refreshes the session on the
          // next request, so this is safe to ignore there.
        }
      },
    },
  });
}
