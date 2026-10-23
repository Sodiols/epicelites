import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader } from "@/components/admin/ui";
import { PlayerForm } from "@/components/admin/player-form";

export const metadata: Metadata = { title: "Add player" };

export default async function NewPlayerPage() {
  await requireAdmin();
  return (
    <div className="grid gap-8">
      <PageHeader title="Add player" back={{ href: "/EEAUTHOR/players", label: "Players" }} />
      <PlayerForm />
    </div>
  );
}
