import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader } from "@/components/admin/ui";
import { PartnerForm } from "@/components/admin/partner-form";

export const metadata: Metadata = { title: "Add partner" };

export default async function NewPartnerPage() {
  await requireAdmin();
  return (
    <div className="grid gap-8">
      <PageHeader title="Add partner" back={{ href: "/EEAUTHOR/partners", label: "Partners" }} />
      <PartnerForm />
    </div>
  );
}
