"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { supabaseKey, supabaseUrl } from "./env";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Browser client for the dashboard (live inbox updates). Shares the session cookies. */
export function createClient() {
  client ??= createBrowserClient<Database>(supabaseUrl, supabaseKey);
  return client;
}
