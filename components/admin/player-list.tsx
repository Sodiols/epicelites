"use client";

import Image from "next/image";
import Link from "next/link";
import { reorderPlayers } from "@/app/(admin)/EEAUTHOR/(console)/players/actions";
import type { PlayerRow } from "@/lib/supabase/types";
import { SortableList } from "./sortable-list";
import { Badge } from "./ui";

type Item = Pick<PlayerRow, "id" | "display_name" | "in_game_name" | "role" | "jersey_number" | "photo_url" | "photo_on_black" | "is_featured" | "is_active">;

export function PlayerList({ players }: { players: Item[] }) {
  return (
    <SortableList
      items={players}
      onSave={reorderPlayers}
      label={(p) => p.display_name}
      render={(p) => (
        <div className="flex items-center gap-3">
          <span className="relative size-12 shrink-0 overflow-hidden bg-carbon">
            {p.photo_url && (
              <Image src={p.photo_url} alt="" fill sizes="48px" className={`object-cover object-top ${p.photo_on_black ? "mix-blend-lighten" : ""}`} />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <Link href={`/EEAUTHOR/players/${p.id}`} className="block truncate font-medium hover:text-violet">
              {p.display_name}
              {p.in_game_name && <span className="text-smoke"> ({p.in_game_name})</span>}
            </Link>
            <span className="block truncate text-xs text-smoke">{p.role}</span>
          </span>
          <span className="hidden items-center gap-2 sm:flex">
            {p.jersey_number && <span className="font-mono text-sm text-smoke">#{p.jersey_number}</span>}
            {p.is_featured && <Badge tone="violet">Featured</Badge>}
            {!p.is_active && <Badge>Inactive</Badge>}
          </span>
        </div>
      )}
    />
  );
}
