import Link from "next/link";
import { zonedDateKey, formatMatchTime } from "@/lib/time";
import type { MatchRow } from "@/lib/supabase/types";

type CalMatch = Pick<MatchRow, "id" | "event_name" | "opponent" | "scoring" | "starts_at" | "time_zone" | "status" | "is_published" | "stage">;

const STATUS_TONE: Record<MatchRow["status"], string> = {
  upcoming: "border-violet/60 bg-violet/15",
  live: "border-violet bg-violet text-night",
  completed: "border-[#2f5a43] bg-[#122219]",
  postponed: "border-[#5a4a2a] bg-[#211b10]",
  cancelled: "border-[#5c2a33] bg-[#1d0f13] line-through",
};

/**
 * Month grid. Each match sits on its date in its own event time zone, which is the date
 * players and organizers use. On narrow screens the grid becomes an agenda list.
 */
export function MatchCalendar({ month, matches, buildHref }: { month: string; matches: CalMatch[]; buildHref: (m: string) => string }) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // Monday-first
  const prev = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);

  const byDay = new Map<string, CalMatch[]>();
  for (const match of matches) {
    const key = zonedDateKey(match.starts_at, match.time_zone);
    byDay.set(key, [...(byDay.get(key) ?? []), match]);
  }
  const title = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(first);
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const label = (c: CalMatch) => (c.scoring === "head_to_head" && c.opponent ? `vs ${c.opponent}` : c.event_name);
  const agenda = [...byDay.entries()].filter(([k]) => k.startsWith(month)).sort(([a], [b]) => a.localeCompare(b));

  return (
    <section aria-label={`Calendar, ${title}`} className="grid gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex gap-1">
          <Link href={buildHref(prev)} className="a-btn a-btn-secondary a-btn-sm" aria-label="Previous month">
            ←
          </Link>
          <Link href={buildHref(new Date().toISOString().slice(0, 7))} className="a-btn a-btn-secondary a-btn-sm">
            Today
          </Link>
          <Link href={buildHref(next)} className="a-btn a-btn-secondary a-btn-sm" aria-label="Next month">
            →
          </Link>
        </div>
      </div>

      <div className="hidden border-t border-l border-line md:grid md:grid-cols-7" role="grid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} role="columnheader" className="border-r border-b border-line bg-carbon px-2 py-1.5 text-xs font-semibold text-smoke">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          const key = day ? `${month}-${String(day).padStart(2, "0")}` : null;
          const items = key ? (byDay.get(key) ?? []) : [];
          return (
            <div key={i} role="gridcell" className={`min-h-28 border-r border-b border-line p-1.5 ${day ? "" : "bg-carbon/40"}`}>
              {day && (
                <span className={`mb-1 inline-grid size-6 place-items-center font-mono text-xs tabular-nums ${key === today ? "bg-violet text-night" : "text-smoke"}`}>
                  {day}
                </span>
              )}
              <ul className="grid gap-1">
                {items.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/EEAUTHOR/matches/${c.id}`}
                      className={`block truncate border px-1.5 py-1 text-xs hover:border-bone ${STATUS_TONE[c.status]} ${c.is_published ? "" : "border-dashed"}`}
                      title={`${c.event_name}${c.stage ? `, ${c.stage}` : ""}`}
                    >
                      <span className="font-mono">{formatMatchTime(c.starts_at, c.time_zone).time.replace(/\s\S+$/, "")}</span> {label(c)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <ol className="grid gap-4 md:hidden">
        {agenda.length === 0 && <li className="text-sm text-smoke">No matches this month.</li>}
        {agenda.map(([day, items]) => (
          <li key={day}>
            <p className="text-xs font-semibold text-smoke">
              {new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`))}
            </p>
            <ul className="mt-1.5 grid gap-1.5">
              {items.map((c) => (
                <li key={c.id}>
                  <Link href={`/EEAUTHOR/matches/${c.id}`} className={`block border px-3 py-2 text-sm ${STATUS_TONE[c.status]} ${c.is_published ? "" : "border-dashed"}`}>
                    <span className="font-mono text-xs">{formatMatchTime(c.starts_at, c.time_zone).time}</span>
                    <span className="block">{label(c)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <p className="a-help">Dashed outline: draft (not on the website).</p>
    </section>
  );
}
