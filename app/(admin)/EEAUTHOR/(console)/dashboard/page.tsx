import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarPlusIcon,
  ImageSquareIcon,
  NotePencilIcon,
  TrophyIcon,
  UserPlusIcon,
} from "@phosphor-icons/react/ssr";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader, EmptyState, Badge } from "@/components/admin/ui";
import { MatchStatusBadge, PublishBadge } from "@/components/admin/status";
import { StatusBars } from "@/components/admin/status-bars";
import { describeActivity } from "@/lib/admin/activity";
import { formatMatchTime, relativeTime } from "@/lib/time";
import { matchHeadline, resultParts } from "@/lib/match-display";
import { MATCH_FORMATS } from "@/lib/labels";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const admin = await requireAdmin();
  const db = admin.supabase;
  const nowIso = new Date().toISOString();
  const count = { count: "exact", head: true } as const;

  const [
    players,
    upcoming,
    completed,
    publishedNews,
    draftNews,
    scheduledNews,
    draftMatches,
    unpublishedMedia,
    media,
    unread,
    nextMatch,
    lastResult,
    statusRows,
    recent,
    pendingResults,
  ] = await Promise.all([
    db.from("players").select("id", count).eq("is_active", true),
    db.from("matches").select("id", count).in("status", ["upcoming", "live"]),
    db.from("matches").select("id", count).eq("status", "completed"),
    db.from("news_posts").select("id", count).eq("status", "published").lte("published_at", nowIso),
    db.from("news_posts").select("id", count).eq("status", "draft"),
    db.from("news_posts").select("id", count).eq("status", "published").gt("published_at", nowIso),
    db.from("matches").select("id", count).eq("is_published", false),
    db.from("media_items").select("id", count).eq("is_published", false),
    db.from("media_items").select("id", count).eq("is_published", true),
    db.from("contact_messages").select("id", count).eq("status", "unread"),
    db
      .from("matches")
      .select("*")
      .in("status", ["upcoming", "live"])
      .order("starts_at")
      .limit(1)
      .maybeSingle(),
    db
      .from("matches")
      .select("*")
      .eq("status", "completed")
      .eq("result_confirmed", true)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("matches").select("status"),
    db.from("audit_logs").select("*").order("occurred_at", { ascending: false }).limit(8),
    db.from("matches").select("id", count).eq("status", "completed").eq("result_confirmed", false),
  ]);

  const { notice } = await searchParams;
  const n = (r: { count: number | null }) => r.count ?? 0;
  const unpublished = n(draftNews) + n(scheduledNews) + n(draftMatches) + n(unpublishedMedia);

  const statusCounts = (statusRows.data ?? []).reduce<Record<string, number>>((acc, m) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1;
    return acc;
  }, {});

  const stats = [
    { label: "Active players", value: n(players), href: "/EEAUTHOR/players" },
    { label: "Upcoming matches", value: n(upcoming), href: "/EEAUTHOR/matches?status=upcoming" },
    { label: "Completed matches", value: n(completed), href: "/EEAUTHOR/results" },
    { label: "Published news", value: n(publishedNews), href: "/EEAUTHOR/news?tab=published" },
    { label: "Unpublished content", value: unpublished, href: "/EEAUTHOR/news?tab=drafts" },
    { label: "Gallery media", value: n(media), href: "/EEAUTHOR/media" },
    { label: "Unread messages", value: n(unread), href: "/EEAUTHOR/messages?status=unread" },
  ];

  const actions = [
    { href: "/EEAUTHOR/matches/new", label: "Schedule Match", icon: CalendarPlusIcon },
    { href: "/EEAUTHOR/results", label: "Add Result", icon: TrophyIcon },
    { href: "/EEAUTHOR/players/new", label: "Add Player", icon: UserPlusIcon },
    { href: "/EEAUTHOR/news/new", label: "Create News", icon: NotePencilIcon },
    { href: "/EEAUTHOR/media?upload=1", label: "Upload Media", icon: ImageSquareIcon },
  ];

  const next = nextMatch.data;
  const last = lastResult.data;

  return (
    <div className="grid gap-8">
      <PageHeader
        title="Dashboard"
        description={`Signed in as ${admin.displayName ?? admin.email}. Everything here is live from the database.`}
      />

      {notice === "owner-only" && (
        <p role="status" className="border border-line bg-carbon px-4 py-3 text-sm text-smoke">
          That page is limited to owners.
        </p>
      )}

      <nav aria-label="Quick actions" className="flex flex-wrap gap-2">
        {actions.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="a-btn a-btn-secondary">
            <Icon size={16} aria-hidden />
            {label}
          </Link>
        ))}
      </nav>

      <section aria-label="Key numbers" className="grid grid-cols-2 border-t border-l border-line sm:grid-cols-4 xl:grid-cols-7">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group border-r border-b border-line p-4 transition-colors hover:bg-carbon">
            <span className="block font-mono text-3xl tabular-nums">{s.value}</span>
            <span className="mt-1 block text-xs text-smoke group-hover:text-bone">{s.label}</span>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="next-title" className="a-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="next-title" className="text-sm font-semibold">
              Next scheduled match
            </h2>
            {next && (
              <div className="flex gap-1.5">
                <MatchStatusBadge status={next.status} />
                <PublishBadge published={next.is_published} />
              </div>
            )}
          </div>
          {next ? (
            <div className="mt-4">
              <p className="font-display text-3xl leading-none">
                {matchHeadline(next, "Epic Elites").primary}
                {matchHeadline(next, "Epic Elites").versus && <span className="text-smoke"> vs {next.opponent}</span>}
              </p>
              <p className="mt-2 text-sm text-smoke">
                {[MATCH_FORMATS[next.format], next.stage, next.organizer].filter(Boolean).join("  /  ")}
              </p>
              <p className="mt-3 font-mono text-sm">
                {formatMatchTime(next.starts_at, next.time_zone).full}{" "}
                <span className="text-smoke">({relativeTime(next.starts_at)})</span>
              </p>
              <Link href={`/EEAUTHOR/matches/${next.id}`} className="a-btn a-btn-secondary a-btn-sm mt-4">
                Open match
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-smoke">
              No upcoming matches. <Link href="/EEAUTHOR/matches/new" className="text-violet underline">Schedule one</Link>.
            </p>
          )}
        </section>

        <section aria-labelledby="result-title" className="a-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="result-title" className="text-sm font-semibold">
              Latest confirmed result
            </h2>
            {n(pendingResults) > 0 && (
              <Link href="/EEAUTHOR/results?filter=pending">
                <Badge tone="amber">{n(pendingResults)} awaiting confirmation</Badge>
              </Link>
            )}
          </div>
          {last ? (
            <div className="mt-4">
              <p className="font-display text-3xl leading-none">{last.event_name}</p>
              <p className="mt-2 text-lg">{resultParts(last).join("  /  ") || "Result confirmed"}</p>
              <p className="mt-1 text-sm text-smoke">
                {last.scoring === "head_to_head" && last.opponent ? `vs ${last.opponent}, ` : ""}
                {last.completed_at ? relativeTime(last.completed_at) : ""}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-smoke">No confirmed results yet. Results appear here once you complete and confirm a match.</p>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section aria-labelledby="status-title" className="a-panel p-5">
          <h2 id="status-title" className="text-sm font-semibold">
            Matches by status
          </h2>
          <div className="mt-5">
            {(statusRows.data ?? []).length > 0 ? (
              <StatusBars
                rows={[
                  { label: "Upcoming", value: statusCounts.upcoming ?? 0, tone: "bg-violet" },
                  { label: "Live", value: statusCounts.live ?? 0, tone: "bg-bone" },
                  { label: "Completed", value: statusCounts.completed ?? 0, tone: "bg-[#8fe0b1]" },
                  { label: "Postponed", value: statusCounts.postponed ?? 0, tone: "bg-[#f0c879]" },
                  { label: "Cancelled", value: statusCounts.cancelled ?? 0, tone: "bg-[#ff9aa6]" },
                ]}
              />
            ) : (
              <p className="text-sm text-smoke">No matches recorded yet.</p>
            )}
          </div>
        </section>

        <section aria-labelledby="recent-title" className="a-panel p-5">
          <div className="flex items-center justify-between">
            <h2 id="recent-title" className="text-sm font-semibold">
              Recently updated
            </h2>
            <Link href="/EEAUTHOR/activity" className="text-xs text-smoke hover:text-bone">
              Full activity log
            </Link>
          </div>
          {(recent.data ?? []).length > 0 ? (
            <ol className="mt-3 divide-y divide-line">
              {(recent.data ?? []).map((row) => {
                const d = describeActivity(row);
                return (
                  <li key={row.id} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                    <span className="min-w-0">
                      <span className="font-medium">{d.title}</span>
                      {d.label && (
                        <>
                          {": "}
                          {d.href ? (
                            <Link href={d.href} className="text-violet hover:underline">
                              {d.label}
                            </Link>
                          ) : (
                            <span>{d.label}</span>
                          )}
                        </>
                      )}
                      <span className="block truncate text-xs text-smoke">{row.actor_email ?? "Website visitor"}</span>
                    </span>
                    <time dateTime={row.occurred_at} className="shrink-0 text-xs text-smoke">
                      {relativeTime(row.occurred_at)}
                    </time>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="mt-3">
              <EmptyState title="No activity yet" body="Changes made in the dashboard are listed here as they happen." />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
