import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { AuthCard, Notice } from "@/components/admin/auth-card";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Admin access" };

const REASONS: Record<string, { tone: "info" | "error"; text: string }> = {
  signin: { tone: "info", text: "Sign in to continue." },
  signedout: { tone: "info", text: "You have been signed out." },
  forbidden: { tone: "error", text: "This account does not have access to the dashboard." },
  "link-expired": { tone: "error", text: "That link is invalid or has expired. Request a new one." },
  setup: { tone: "error", text: "Supabase is not configured on this server yet. See SETUP.md." },
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const session = await getAdminSession();
  if (session.status === "ok") redirect("/EEAUTHOR/dashboard");

  const { reason } = await searchParams;
  const notice =
    session.status === "unconfigured"
      ? REASONS.setup
      : session.status === "forbidden"
        ? REASONS.forbidden
        : reason
          ? REASONS[reason]
          : undefined;

  return (
    <AuthCard title="Admin access" notice={notice && <Notice tone={notice.tone}>{notice.text}</Notice>}>
      <LoginForm signedInAs={session.status === "forbidden" ? session.email : null} />
    </AuthCard>
  );
}
