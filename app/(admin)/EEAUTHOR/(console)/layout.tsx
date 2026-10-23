import { AdminShell } from "@/components/admin/shell";
import { requireAdmin } from "@/lib/auth/admin";

/** Every console page sits behind this check, and each one repeats it for its own data. */
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [{ count }, { data: settings }] = await Promise.all([
    admin.supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "unread"),
    admin.supabase.from("team_settings").select("logo_url").eq("id", 1).maybeSingle(),
  ]);

  return (
    <AdminShell
      admin={{ email: admin.email, displayName: admin.displayName, role: admin.role }}
      unread={count ?? 0}
      logoUrl={settings?.logo_url ?? "/images/epic-elites-mark.webp"}
    >
      {children}
    </AdminShell>
  );
}
