import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader } from "@/components/admin/ui";
import { PartnerForm } from "@/components/admin/partner-form";
import { uuid } from "@/lib/validations/common";

export const metadata: Metadata = { title: "Edit partner" };

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const admin = await requireAdmin();
  const { data: partner } = await admin.supabase.from("partners").select("*").eq("id", id).maybeSingle();
  if (!partner) notFound();
  return (
    <div className="grid gap-8">
      <PageHeader title={partner.name} back={{ href: "/EEAUTHOR/partners", label: "Partners" }} />
      <PartnerForm partner={partner} />
    </div>
  );
}
