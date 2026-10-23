"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, siteUrl } from "@/lib/supabase/env";
import { REMEMBER_COOKIE } from "@/lib/supabase/cookies";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type AuthState = { ok: boolean; message?: string; fieldErrors?: Record<string, string> } | null;

const credentials = z.object({
  email: z.string().trim().toLowerCase().email("Enter the email address for your admin account.").max(320),
  password: z.string().min(1, "Enter your password.").max(200),
  remember: z.string().optional(),
});

/** Same wording for every credential failure, so the form never reveals which accounts exist. */
const BAD_LOGIN = "That email and password combination is not valid.";

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { ok: false, message: "Supabase is not configured on this server yet." };

  const parsed = credentials.safeParse({
    email: form.get("email"),
    password: form.get("password"),
    remember: form.get("remember") ?? undefined,
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { ok: false, message: "Check the highlighted fields.", fieldErrors: errors };
  }
  const { email, password, remember } = parsed.data;

  const ip = await clientIp();
  const byIp = rateLimit(`login:ip:${ip}`, 10, 15 * 60_000);
  const byEmail = rateLimit(`login:email:${email}`, 6, 15 * 60_000);
  if (!byIp.ok || !byEmail.ok) {
    return { ok: false, message: "Too many sign-in attempts. Wait 15 minutes and try again." };
  }

  const keep = remember === "on";
  const cookieStore = await cookies();
  cookieStore.set(REMEMBER_COOKIE, keep ? "1" : "0", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(keep ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, message: BAD_LOGIN };

  const { data: admin } = await supabase
    .from("admin_users")
    .select("is_active")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!admin?.is_active) {
    await supabase.auth.signOut({ scope: "local" });
    return { ok: false, message: "This account does not have access to the Epic Elites dashboard." };
  }

  redirect("/EEAUTHOR/dashboard");
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  }
  (await cookies()).delete(REMEMBER_COOKIE);
  redirect("/EEAUTHOR?reason=signedout");
}

export async function requestPasswordReset(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { ok: false, message: "Supabase is not configured on this server yet." };
  const email = z.string().trim().toLowerCase().email().max(320).safeParse(form.get("email"));
  if (!email.success) return { ok: false, fieldErrors: { email: "Enter a valid email address." }, message: "Check the email address." };

  const ip = await clientIp();
  if (!rateLimit(`reset:${ip}`, 5, 60 * 60_000).ok) {
    return { ok: false, message: "Too many reset requests. Try again in an hour." };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${siteUrl}/EEAUTHOR/auth/confirm?next=/EEAUTHOR/reset`,
  });
  // Always the same response, whether or not the account exists.
  return { ok: true, message: "If that address belongs to an account, a reset link is on its way. It expires in one hour." };
}

const newPassword = z
  .object({
    password: z.string().min(12, "Use at least 12 characters.").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The two passwords do not match." });

export async function updatePassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = newPassword.safeParse({ password: form.get("password"), confirm: form.get("confirm") });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { ok: false, message: "Check the highlighted fields.", fieldErrors: errors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "This reset link has expired. Request a new one." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: error.message.includes("same") ? "Choose a password you have not used before." : "The password could not be changed. Request a new reset link." };

  // End every other session for this account after a password change.
  await supabase.auth.signOut({ scope: "others" });
  redirect("/EEAUTHOR/dashboard");
}
