import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { PartnerList } from "@/components/admin/partner-form";

export const metadata: Metadata = { title: "Partners" };

export default async function PartnersPage() {
  const admin = await requireAdmin();
  const { data } = await admin.supabase.from("partners").select("id, name, logo_url, partner_type, is_active").order("display_order");
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Partners"
        description="Sponsors and partners. The Partners section on the About page only appears when at least one is shown."
        actions={
          <Link href="/EEAUTHOR/partners/new" className="a-btn a-btn-primary">
            <PlusIcon size={16} aria-hidden /> Add partner
          </Link>
        }
      />
      {(data ?? []).length === 0 ? (
        <EmptyState title="No partners yet" body="Add a partner once an agreement is confirmed. Nothing is shown publicly until then." />
      ) : (
        <PartnerList partners={data ?? []} />
      )}
    </div>
  );
}
