import type { Metadata } from "next";
import Link from "next/link";
import { UserPlusIcon } from "@phosphor-icons/react/ssr";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader, EmptyState, FilterTabs } from "@/components/admin/ui";
import { PlayerList } from "@/components/admin/player-list";

export const metadata: Metadata = { title: "Players" };

export default async function PlayersPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const admin = await requireAdmin();
  const { show } = await searchParams;
  const inactive = show === "inactive";
  const { data: all } = await admin.supabase
    .from("players")
    .select("id, display_name, in_game_name, role, jersey_number, photo_url, photo_on_black, is_featured, is_active, display_order")
    .order("display_order")
    .order("created_at");
  const players = (all ?? []).filter((p) => p.is_active !== inactive);
  const activeCount = (all ?? []).filter((p) => p.is_active).length;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Players"
        description="The roster shown on the website, in this order. Drag to reorder; inactive players are hidden from visitors but kept here."
        actions={
          <Link href="/EEAUTHOR/players/new" className="a-btn a-btn-primary">
            <UserPlusIcon size={16} aria-hidden />
            Add Player
          </Link>
        }
      />
      <FilterTabs
        active={inactive ? "inactive" : "active"}
        items={[
          { key: "active", label: "Active roster", href: "/EEAUTHOR/players", count: activeCount },
          { key: "inactive", label: "Inactive", href: "/EEAUTHOR/players?show=inactive", count: (all ?? []).length - activeCount },
        ]}
      />
      {players.length === 0 ? (
        <EmptyState
          title={inactive ? "No inactive players" : "No active players"}
          body={inactive ? "Players you mark inactive appear here and can be restored at any time." : "Add a player to start building the roster."}
        />
      ) : (
        <PlayerList players={players} />
      )}
    </div>
  );
}
