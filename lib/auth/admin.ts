import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AdminRole } from "@/lib/supabase/types";

export type AdminSession =
  | { status: "unconfigured" }
  | { status: "signed_out" }
  | { status: "forbidden"; email: string }
  | {
      status: "ok";
      userId: string;
      email: string;
      role: AdminRole;
      displayName: string | null;
      supabase: Awaited<ReturnType<typeof createClient>>;
    };

/**
 * Resolves the current request's admin. getUser() asks Supabase Auth to validate the
 * session (so a revoked or signed-out session fails here), and the role comes from the
 * admin_users table, never from user-editable metadata. Cached per request.
 */
export const getAdminSession = cache(async (): Promise<AdminSession> => {
  if (!isSupabaseConfigured) return { status: "unconfigured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const { data: admin } = await supabase
    .from("admin_users")
    .select("role, is_active, display_name, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin || !admin.is_active) return { status: "forbidden", email: user.email ?? "" };

  return {
    status: "ok",
    userId: user.id,
    email: admin.email,
    role: admin.role,
    displayName: admin.display_name,
    supabase,
  };
});

export type ActiveAdmin = Extract<AdminSession, { status: "ok" }>;

/** For admin pages: returns the admin or redirects away. */
export async function requireAdmin(options: { owner?: boolean } = {}): Promise<ActiveAdmin> {
  const session = await getAdminSession();
  if (session.status === "unconfigured") redirect("/EEAUTHOR?reason=setup");
  if (session.status === "signed_out") redirect("/EEAUTHOR?reason=signin");
  if (session.status === "forbidden") redirect("/EEAUTHOR?reason=forbidden");
  if (options.owner && session.role !== "owner") redirect("/EEAUTHOR/dashboard?notice=owner-only");
  return session;
}

export type ActionResult<T = unknown> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

/**
 * For Server Actions and route handlers: re-verifies the caller on every invocation, since
 * actions are reachable by direct POST regardless of which UI rendered them.
 */
export async function authorize(
  options: { owner?: boolean } = {},
): Promise<{ ok: true; admin: ActiveAdmin } | { ok: false; result: { ok: false; message: string } }> {
  const session = await getAdminSession();
  if (session.status !== "ok") {
    return {
      ok: false,
      result: {
        ok: false,
        message:
          session.status === "signed_out"
            ? "Your session has expired. Sign in again to continue."
            : "You do not have permission to do that.",
      },
    };
  }
  if (options.owner && session.role !== "owner") {
    return { ok: false, result: { ok: false, message: "Only an owner can do that." } };
  }
  return { ok: true, admin: session };
}
