import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader } from "@/components/admin/ui";
import { MatchForm } from "@/components/admin/match-form";

export const metadata: Metadata = { title: "Schedule match" };

export default async function NewMatchPage() {
  await requireAdmin();
  return (
    <div className="grid gap-8">
      <PageHeader title="Schedule match" back={{ href: "/EEAUTHOR/matches", label: "Matches" }} description="New matches start as drafts unless you publish them." />
      <MatchForm />
    </div>
  );
}
