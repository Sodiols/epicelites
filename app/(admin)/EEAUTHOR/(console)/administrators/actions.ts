"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize, type ActionResult } from "@/lib/auth/admin";
import { fieldErrors, formToObject, optionalText, uuid } from "@/lib/validations/common";

/*
 * Owner-only. Each action re-checks the owner role here, and the database enforces it again
 * (RLS policies on admin_users and the owner check inside admin_grant_access), plus a trigger
 * that refuses to remove, disable or demote the last active owner.
 */

function friendly(message: string): string {
  if (message.includes("last active owner")) return "This is the only active owner. Make someone else an owner first.";
  if (message.includes("No account exists")) return "No Supabase account uses that email. Create the user in Supabase Authentication first.";
  if (message.includes("Only an owner")) return "Only an owner can manage administrators.";
  return "The change could not be saved.";
}

const grantSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter the email of an existing Supabase user.").max(320),
  role: z.enum(["owner", "editor"]),
  display_name: optionalText(80),
});

export async function grantAccess(form: FormData): Promise<ActionResult> {
  const auth = await authorize({ owner: true });
  if (!auth.ok) return auth.result;
  const parsed = grantSchema.safeParse(formToObject(form));
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const { error } = await auth.admin.supabase.rpc("admin_grant_access", {
    p_email: parsed.data.email,
    p_role: parsed.data.role,
    p_display_name: parsed.data.display_name,
  });
  if (error) return { ok: false, message: friendly(error.message), fieldErrors: error.message.includes("No account") ? { email: "No account with this email." } : undefined };
  revalidatePath("/EEAUTHOR/administrators");
  return { ok: true, message: `${parsed.data.email} can now sign in as ${parsed.data.role === "owner" ? "an owner" : "an editor"}.` };
}

export async function updateAdmin(userId: string, patch: { role?: "owner" | "editor"; is_active?: boolean }): Promise<ActionResult> {
  const auth = await authorize({ owner: true });
  if (!auth.ok) return auth.result;
  const parsed = z.object({ role: z.enum(["owner", "editor"]).optional(), is_active: z.boolean().optional() }).safeParse(patch);
  if (!uuid.safeParse(userId).success || !parsed.success) return { ok: false, message: "Invalid change." };
  const { data, error } = await auth.admin.supabase.from("admin_users").update(parsed.data).eq("user_id", userId).select("user_id");
  if (error) return { ok: false, message: friendly(error.message) };
  if (!data?.length) return { ok: false, message: "That administrator no longer exists." };
  revalidatePath("/EEAUTHOR", "layout");
  return {
    ok: true,
    message: parsed.data.role ? `Role changed to ${parsed.data.role}` : parsed.data.is_active ? "Access restored" : "Access disabled. Their next request is refused.",
  };
}

export async function revokeAccess(userId: string): Promise<ActionResult> {
  const auth = await authorize({ owner: true });
  if (!auth.ok) return auth.result;
  if (!uuid.safeParse(userId).success) return { ok: false, message: "Invalid administrator." };
  const { error } = await auth.admin.supabase.from("admin_users").delete().eq("user_id", userId);
  if (error) return { ok: false, message: friendly(error.message) };
  revalidatePath("/EEAUTHOR", "layout");
  return { ok: true, message: "Access revoked. Their account still exists in Supabase Auth but can no longer use the dashboard." };
}
