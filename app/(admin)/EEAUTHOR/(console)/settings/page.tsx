import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { formatMatchTime } from "@/lib/time";

export const metadata: Metadata = { title: "Website settings" };

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const db = admin.supabase;
  const now = new Date().toISOString();
  const [{ data: settings }, { data: matches }, { data: news }] = await Promise.all([
    db.from("team_settings").select("*").eq("id", 1).maybeSingle(),
    db.from("matches").select("id, event_name, opponent, scoring, starts_at, time_zone").eq("is_published", true).in("status", ["upcoming", "live"]).order("starts_at"),
    db.from("news_posts").select("id, title").eq("status", "published").lte("published_at", now).order("published_at", { ascending: false }).limit(50),
  ]);

  return (
    <div className="grid gap-8">
      <PageHeader title="Website settings" description="Team identity, links, brand artwork and the editable text on the homepage and About page." />
      {settings ? (
        <SettingsForm
          settings={settings}
          matches={(matches ?? []).map((m) => ({
            value: m.id,
            label: `${m.scoring === "head_to_head" && m.opponent ? `vs ${m.opponent}` : m.event_name}, ${formatMatchTime(m.starts_at, m.time_zone).day}`,
          }))}
          news={(news ?? []).map((n) => ({ value: n.id, label: n.title }))}
        />
      ) : (
        <EmptyState title="Settings row missing" body="Run supabase/seed.sql to create the initial team settings, then reload." />
      )}
    </div>
  );
}
