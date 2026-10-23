import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDotsIcon, ListBulletsIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader, EmptyState, FilterTabs } from "@/components/admin/ui";
import { MatchStatusBadge, PublishBadge } from "@/components/admin/status";
import { MatchRowActions } from "@/components/admin/match-row-actions";
import { MatchCalendar } from "@/components/admin/match-calendar";
import { MATCH_FORMATS } from "@/lib/labels";
import { formatMatchTime } from "@/lib/time";

export const metadata: Metadata = { title: "Matches" };

type Search = { status?: string; q?: string; event?: string; view?: string; month?: string };
const STATUS_FILTERS = {
  all: null,
  upcoming: ["upcoming"],
  live: ["live"],
  completed: ["completed"],
  other: ["postponed", "cancelled"],
} as const;

export default async function MatchesAdminPage({ searchParams }: { searchParams: Promise<Search> }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const status = (sp.status && sp.status in STATUS_FILTERS ? sp.status : "all") as keyof typeof STATUS_FILTERS;
  const view = sp.view === "calendar" ? "calendar" : "list";
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? sp.month! : new Date().toISOString().slice(0, 7);
  const q = (sp.q ?? "").trim().slice(0, 80);

  const href = (patch: Partial<Search>) => {
    const p = new URLSearchParams();
    const merged = { status, q, event: sp.event, view, month: sp.month, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v && !(k === "status" && v === "all") && !(k === "view" && v === "list")) p.set(k, v);
    const s = p.toString();
    return `/EEAUTHOR/matches${s ? `?${s}` : ""}`;
  };

  let query = admin.supabase
    .from("matches")
    .select("id, event_name, stage, opponent, format, scoring, starts_at, time_zone, status, is_published, is_featured, organizer")
    .order("starts_at", { ascending: status !== "completed" });
  const statuses = STATUS_FILTERS[status];
  if (statuses) query = query.in("status", [...statuses]);
  if (sp.event) query = query.eq("event_name", sp.event);
  if (q) {
    const term = `%${q.replace(/[%_,()]/g, "")}%`;
    query = query.or(`event_name.ilike.${term},opponent.ilike.${term},stage.ilike.${term},organizer.ilike.${term}`);
  }
  if (view === "calendar") {
    const [y, m] = month.split("-").map(Number);
    query = query
      .gte("starts_at", new Date(Date.UTC(y, m - 1, 1) - 86_400_000).toISOString())
      .lt("starts_at", new Date(Date.UTC(y, m, 1) + 86_400_000).toISOString());
  }

  const [{ data: matches, error }, { data: events }, counts] = await Promise.all([
    query.limit(500),
    admin.supabase.from("matches").select("event_name").order("event_name"),
    admin.supabase.from("matches").select("status"),
  ]);

  const eventNames = [...new Set((events ?? []).map((e) => e.event_name))];
  const tally = (counts.data ?? []).reduce<Record<string, number>>((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});
  const rows = matches ?? [];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Matches"
        description="Schedule fixtures, keep times current and publish them. Results are entered on each match."
        actions={
          <Link href="/EEAUTHOR/matches/new" className="a-btn a-btn-primary">
            <PlusIcon size={16} aria-hidden />
            Schedule Match
          </Link>
        }
      />

      <FilterTabs
        active={status}
        items={[
          { key: "all", label: "All", href: href({ status: "all" }), count: counts.data?.length ?? 0 },
          { key: "upcoming", label: "Upcoming", href: href({ status: "upcoming" }), count: tally.upcoming ?? 0 },
          { key: "live", label: "Live", href: href({ status: "live" }), count: tally.live ?? 0 },
          { key: "completed", label: "Completed", href: href({ status: "completed" }), count: tally.completed ?? 0 },
          { key: "other", label: "Postponed and cancelled", href: href({ status: "other" }), count: (tally.postponed ?? 0) + (tally.cancelled ?? 0) },
        ]}
      />

      <form method="get" className="flex flex-wrap items-end gap-2" role="search">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        {view === "calendar" && <input type="hidden" name="view" value="calendar" />}
        <label className="grid min-w-56 flex-1 gap-1">
          <span className="a-label">Search</span>
          <input name="q" type="search" defaultValue={q} placeholder="Event, opponent, stage, organizer…" className="a-input" />
        </label>
        <label className="grid min-w-48 gap-1">
          <span className="a-label">Tournament</span>
          <select name="event" defaultValue={sp.event ?? ""} className="a-input">
            <option value="">All tournaments</option>
            {eventNames.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="a-btn a-btn-secondary">
          Apply
        </button>
        <div className="ml-auto flex border border-line" role="group" aria-label="View">
          <Link href={href({ view: "list" })} aria-current={view === "list" ? "page" : undefined} className={`a-btn a-btn-sm ${view === "list" ? "bg-graphite text-bone" : "a-btn-ghost"}`}>
            <ListBulletsIcon size={16} aria-hidden /> List
          </Link>
          <Link href={href({ view: "calendar" })} aria-current={view === "calendar" ? "page" : undefined} className={`a-btn a-btn-sm ${view === "calendar" ? "bg-graphite text-bone" : "a-btn-ghost"}`}>
            <CalendarDotsIcon size={16} aria-hidden /> Calendar
          </Link>
        </div>
      </form>

      {error && <p role="alert" className="text-sm text-[#ff9aa6]">Matches could not be loaded: {error.message}</p>}

      {view === "calendar" ? (
        <MatchCalendar month={month} matches={rows} buildHref={(m) => href({ view: "calendar", month: m })} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={q || sp.event || status !== "all" ? "No matches match these filters" : "No matches scheduled yet"}
          body="Scheduled matches appear here in date order. Drafts stay private until you publish them."
          action={
            <Link href="/EEAUTHOR/matches/new" className="a-btn a-btn-primary a-btn-sm">
              Schedule Match
            </Link>
          }
        />
      ) : (
        <ul className="border-t border-line">
          <li className="hidden grid-cols-[11rem_1fr_9rem_8rem_3rem] gap-4 border-b border-line px-3 py-2 text-xs font-semibold text-smoke md:grid">
            <span>Date</span>
            <span>Match</span>
            <span>Status</span>
            <span>Website</span>
            <span className="sr-only">Actions</span>
          </li>
          {rows.map((m) => {
            const when = formatMatchTime(m.starts_at, m.time_zone);
            const title = m.scoring === "head_to_head" ? `vs ${m.opponent ?? "Opponent TBA"}` : m.event_name;
            return (
              <li key={m.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-line px-3 py-3 transition-colors hover:bg-carbon md:grid-cols-[11rem_1fr_9rem_8rem_3rem]">
                <span className="col-span-2 font-mono text-xs text-smoke tabular-nums md:col-span-1 md:text-sm">
                  {when.day}
                  <span className="block">{when.time}</span>
                </span>
                <span className="min-w-0">
                  <Link href={`/EEAUTHOR/matches/${m.id}`} className="block truncate font-medium hover:text-violet">
                    {title}
                  </Link>
                  <span className="block truncate text-xs text-smoke">
                    {[m.scoring === "head_to_head" ? m.event_name : null, m.stage, MATCH_FORMATS[m.format]].filter(Boolean).join("  /  ")}
                  </span>
                </span>
                <span className="row-start-2 flex gap-1.5 md:row-start-auto">
                  <MatchStatusBadge status={m.status} />
                  {m.is_featured && <span className="text-xs text-violet">Featured</span>}
                </span>
                <span className="row-start-2 md:row-start-auto">
                  <PublishBadge published={m.is_published} />
                </span>
                <span className="col-start-2 row-span-2 row-start-2 justify-self-end md:col-start-auto md:row-span-1 md:row-start-auto">
                  <MatchRowActions id={m.id} title={title} status={m.status} published={m.is_published} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
