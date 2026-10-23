import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/auth-card";
import { ResetForm } from "@/components/admin/password-forms";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Choose a new password" };

/** Reached from the recovery email via /EEAUTHOR/auth/confirm, which creates the session. */
export default async function ResetPasswordPage() {
  if (!isSupabaseConfigured) redirect("/EEAUTHOR?reason=setup");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/EEAUTHOR?reason=link-expired");

  return (
    <AuthCard title="New password">
      <ResetForm />
    </AuthCard>
  );
}
