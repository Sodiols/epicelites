import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader, Badge } from "@/components/admin/ui";
import { PlayerForm } from "@/components/admin/player-form";
import { uuid } from "@/lib/validations/common";

export const metadata: Metadata = { title: "Edit player" };

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const admin = await requireAdmin();
  const { data: player } = await admin.supabase.from("players").select("*").eq("id", id).maybeSingle();
  if (!player) notFound();

  return (
    <div className="grid gap-8">
      <PageHeader
        title={player.display_name}
        back={{ href: "/EEAUTHOR/players", label: "Players" }}
        description={player.is_active ? undefined : <Badge>Inactive, hidden from the website</Badge>}
      />
      <PlayerForm player={player} />
    </div>
  );
}
