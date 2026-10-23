import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader, EmptyState, FilterTabs, Badge } from "@/components/admin/ui";
import { MatchStatusBadge } from "@/components/admin/status";
import { formatMatchTime } from "@/lib/time";
import { resultParts } from "@/lib/match-display";
import { MATCH_FORMATS } from "@/lib/labels";

export const metadata: Metadata = { title: "Results" };

type Filter = "needs" | "pending" | "confirmed";

/**
 * Results work queue. "Needs a result" lists matches whose start time has passed but have no
 * result yet; nothing is completed automatically, the admin opens the match and enters it.
 */
export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const admin = await requireAdmin();
  const { filter: f } = await searchParams;
  const filter: Filter = f === "pending" || f === "confirmed" ? f : "needs";
  const now = new Date().toISOString();
  const db = admin.supabase;
  const cols = "id, event_name, stage, opponent, format, scoring, starts_at, time_zone, status, completed_at, result_confirmed, is_published, br_placement, br_kills, br_total_points, br_rounds_played, h2h_team_score, h2h_opponent_score, h2h_outcome";

  const [needs, pending, confirmed] = await Promise.all([
    db.from("matches").select(cols).in("status", ["upcoming", "live"]).lte("starts_at", now).order("starts_at"),
    db.from("matches").select(cols).eq("status", "completed").eq("result_confirmed", false).order("starts_at", { ascending: false }),
    db.from("matches").select(cols).eq("status", "completed").eq("result_confirmed", true).order("completed_at", { ascending: false }).limit(100),
  ]);
  const lists = { needs: needs.data ?? [], pending: pending.data ?? [], confirmed: confirmed.data ?? [] };
  const rows = lists[filter];

  return (
    <div className="grid gap-6">
      <PageHeader title="Results" description="Enter results on existing matches, confirm them, and they appear in the public Results tab." />
      <FilterTabs
        active={filter}
        items={[
          { key: "needs", label: "Needs a result", href: "/EEAUTHOR/results", count: lists.needs.length },
          { key: "pending", label: "Awaiting confirmation", href: "/EEAUTHOR/results?filter=pending", count: lists.pending.length },
          { key: "confirmed", label: "Confirmed", href: "/EEAUTHOR/results?filter=confirmed", count: lists.confirmed.length },
        ]}
      />
      {rows.length === 0 ? (
        <EmptyState
          title={filter === "needs" ? "Nothing waiting for a result" : filter === "pending" ? "No unconfirmed results" : "No confirmed results yet"}
          body={
            filter === "needs"
              ? "Matches show up here once their start time has passed. You can also enter a result from any match's page."
              : "Saved results stay private until you confirm them."
          }
          action={
            <Link href="/EEAUTHOR/matches" className="a-btn a-btn-secondary a-btn-sm">
              Go to matches
            </Link>
          }
        />
      ) : (
        <ul className="border-t border-line">
          {rows.map((m) => {
            const when = formatMatchTime(m.starts_at, m.time_zone);
            const parts = resultParts(m);
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line px-3 py-3 hover:bg-carbon">
                <span className="w-40 font-mono text-xs text-smoke tabular-nums">{when.full}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {m.scoring === "head_to_head" ? `vs ${m.opponent ?? "Opponent TBA"}, ` : ""}
                    {m.event_name}
                  </span>
                  <span className="text-xs text-smoke">{[m.stage, MATCH_FORMATS[m.format]].filter(Boolean).join("  /  ")}</span>
                </span>
                <span className="text-sm">{parts.length ? parts.join("  /  ") : <MatchStatusBadge status={m.status} />}</span>
                {!m.is_published && <Badge>Match is a draft</Badge>}
                <Link href={`/EEAUTHOR/matches/${m.id}#result`} className="a-btn a-btn-secondary a-btn-sm">
                  {filter === "needs" ? "Enter result" : filter === "pending" ? "Review and confirm" : "Edit result"}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
