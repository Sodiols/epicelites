import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader } from "@/components/admin/ui";
import { AdminRow, GrantAccessForm } from "@/components/admin/admin-users";

export const metadata: Metadata = { title: "Administrators" };

export default async function AdministratorsPage() {
  const admin = await requireAdmin({ owner: true });
  const { data: admins } = await admin.supabase.from("admin_users").select("*").order("role").order("created_at");

  return (
    <div className="grid gap-8">
      <PageHeader title="Administrators" description="Owners manage everything, including this list. Editors manage website content only." />

      <section aria-labelledby="grant-title" className="a-panel grid gap-4 p-5">
        <div>
          <h2 id="grant-title" className="text-sm font-semibold">
            Grant access
          </h2>
          <p className="a-help mt-1 max-w-[70ch]">
            For security there is no public sign-up. First create the person&apos;s account in Supabase (Authentication, Users, Add user, or send an
            invite), then grant it access here.
          </p>
        </div>
        <GrantAccessForm />
      </section>

      <section aria-labelledby="list-title" className="grid gap-3">
        <h2 id="list-title" className="text-sm font-semibold">
          Current administrators
        </h2>
        <ul className="border-t border-line">
          {(admins ?? []).map((a) => (
            <AdminRow key={a.user_id} admin={a} isSelf={a.user_id === admin.userId} />
          ))}
        </ul>
        <p className="a-help max-w-[80ch]">
          Disabling or revoking takes effect on the person&apos;s very next request: every page and save checks this list, and the database
          refuses their reads and writes. Their sign-in session itself lasts until it expires; to end it immediately, also use &quot;Sign out
          user&quot; or delete the user in Supabase Authentication.
        </p>
      </section>
    </div>
  );
}
