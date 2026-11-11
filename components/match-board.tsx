"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { CalendarBlankIcon, TrophyIcon } from "@phosphor-icons/react";
import { easeOutExpo, snappy } from "@/lib/motion";
import type { Match } from "@/lib/data/public";
import { MATCH_FORMATS, MATCH_STATUSES } from "@/lib/labels";
import { matchContext, matchHeadline, resultParts } from "@/lib/match-display";
import { formatMatchTime } from "@/lib/time";
import { StreamButton } from "@/components/stream-button";
import { ResultImage } from "@/components/result-image";

type Tab = "upcoming" | "results";

/**
 * Upcoming and results share one board. The active tab marker slides between tabs on a
 * spring, and panels travel in the direction of the tab you picked.
 */
export function MatchBoard({
  upcoming,
  results,
  teamName,
}: {
  upcoming: Match[];
  results: Match[];
  teamName: string;
}) {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [tournament, setTournament] = useState("");
  const [resultLimit, setResultLimit] = useState(20);
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "upcoming", label: "Upcoming", count: upcoming.length },
    { id: "results", label: "Results archive", count: results.length },
  ];
  const refs = useRef<Record<Tab, HTMLButtonElement | null>>({ upcoming: null, results: null });
  const dir = tab === "upcoming" ? -1 : 1;
  const query = tournament.trim().toLowerCase();
  const archive = results.filter((match) => match.event_name.toLowerCase().includes(query));
  const list = tab === "upcoming" ? upcoming : archive.slice(0, resultLimit);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next: Tab = tab === "upcoming" ? "results" : "upcoming";
    setTab(next);
    refs.current[next]?.focus();
  };

  return (
    <section aria-label="Match board" className="mx-auto mt-16 max-w-[1400px] px-4 sm:px-8">
      <div role="tablist" aria-label="Matches" className="flex gap-2 border-b border-line" onKeyDown={onKeyDown}>
        {tabs.map((t) => {
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el;
              }}
              id={`tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 px-2 py-4 text-xs font-semibold tracking-[0.08em] whitespace-nowrap uppercase transition-colors sm:gap-3 sm:px-5 sm:text-sm ${
                selected ? "text-bone" : "text-smoke hover:text-bone"
              }`}
              style={{ fontStretch: "112%" }}
            >
              {t.label}
              <span className="font-mono text-xs text-smoke tabular-nums">{String(t.count).padStart(2, "0")}</span>
              {selected && (
                <motion.span
                  layoutId="match-tab"
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-violet"
                  transition={snappy}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={tab}
            id={`panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: `${d * 30}%`, opacity: 0 }),
              center: { x: "0%", opacity: 1 },
              exit: (d: number) => ({ x: `${d * -30}%`, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6, ease: easeOutExpo }}
          >
            {tab === "results" && results.length > 0 && (
              <div className="my-6 flex flex-wrap items-end justify-between gap-3">
                <label className="grid w-full max-w-xs gap-2 text-sm font-semibold">
                  Find a tournament
                  <input
                    type="search"
                    value={tournament}
                    onChange={(event) => {
                      setTournament(event.target.value);
                      setResultLimit(20);
                    }}
                    className="min-h-11 border border-line bg-carbon px-3 font-normal text-bone"
                  />
                </label>
                <p role="status" className="text-sm text-smoke">
                  {list.length} of {archive.length} results
                </p>
              </div>
            )}
            {list.length > 0 ? (
              <ol>
                {list.map((f) => (
                  <FixtureRow key={f.id} fixture={f} kind={tab} teamName={teamName} />
                ))}
              </ol>
            ) : tab === "results" && results.length > 0 ? (
              <p className="py-10 text-smoke">No tournaments match your search.</p>
            ) : (
              <EmptyBoard kind={tab} />
            )}
            {tab === "results" && archive.length > resultLimit && (
              <button type="button" className="btn btn-ghost mt-6" onClick={() => setResultLimit((limit) => limit + 20)}>
                Show more results
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function FixtureRow({ fixture: m, kind, teamName }: { fixture: Match; kind: Tab; teamName: string }) {
  const headline = matchHeadline(m, teamName);
  const when = formatMatchTime(m.starts_at, m.time_zone);
  const result = resultParts(m);
  const flagged = m.status === "live" || m.status === "postponed" || m.status === "cancelled";

  return (
    <li className="group border-b border-line py-7 transition-colors hover:bg-carbon md:px-4">
      <div className="grid gap-3 md:grid-cols-[8rem_minmax(0,1fr)] md:gap-x-8 lg:grid-cols-[11rem_minmax(0,1fr)_auto] lg:items-center">
        <span className="font-mono text-sm text-smoke tabular-nums">
          <time dateTime={m.starts_at}>{when.day}</time>
          <span className="block">{when.time}</span>
        </span>
        <span className="flex items-start gap-4 sm:gap-6">
          {m.cover_url && (kind === "results" ? (
            <ResultImage src={m.cover_url} eventName={m.event_name} />
          ) : (
            <span className="chamfer relative aspect-[16/10] w-24 shrink-0 overflow-hidden bg-carbon [--cut:10px] sm:w-36">
              <Image
                src={m.cover_url}
                alt={`${m.event_name} cover`}
                fill
                sizes="(min-width: 640px) 144px, 96px"
                className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
              />
            </span>
          ))}
          <span className="min-w-0">
            {flagged && (
              <span
                className={`mb-2 inline-flex items-center gap-2 px-2 py-0.5 text-xs font-semibold uppercase ${
                  m.status === "live" ? "bg-live text-bone" : "border border-line text-smoke"
                }`}
              >
                {m.status === "live" && (
                  <span className="relative size-1.5" aria-hidden>
                    <span className="absolute inset-0 rounded-full bg-current motion-safe:animate-ping" />
                    <span className="relative block size-1.5 rounded-full bg-current" />
                  </span>
                )}
                {MATCH_STATUSES[m.status]}
              </span>
            )}
            <span className="font-display block text-[clamp(1.75rem,3.5vw,2.75rem)] leading-none">
              {headline.primary}
              {headline.versus && (
                <>
                  {" "}
                  <span className="text-smoke">vs</span> {headline.versus}
                </>
              )}
            </span>
            <span className="mt-2 block text-sm text-smoke">{matchContext(m) || MATCH_FORMATS[m.format]}</span>
            {kind === "results" && m.organizer && <span className="mt-1 block text-sm text-smoke">{m.organizer}</span>}
          </span>
        </span>
        <span className="flex flex-col md:col-start-2 lg:col-start-auto lg:items-end">
          {kind === "results" ? (
            <>
              <span className="font-semibold text-violet">{result.join("  /  ") || "Result confirmed"}</span>
              {(m.br_placement_points !== null || m.br_kill_points !== null) && (
                <span className="mt-1 text-xs text-smoke">
                  {[
                    m.br_placement_points !== null && `${m.br_placement_points} placement pts`,
                    m.br_kill_points !== null && `${m.br_kill_points} kill pts`,
                  ].filter(Boolean).join("  /  ")}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-smoke">{m.organizer ?? MATCH_FORMATS[m.format]}</span>
          )}
          <span className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm md:justify-end">
            {m.info_url && (
              <a href={m.info_url} target="_blank" rel="noopener noreferrer" className="link-underline text-bone hover:text-violet">
                Event info
              </a>
            )}
            {m.stream_url && <StreamButton url={m.stream_url} status={m.status} size="sm" />}
          </span>
        </span>
      </div>
      {kind === "results" && m.rounds.length > 0 && (
        <details className="mt-4 md:ml-40 lg:ml-52">
          <summary className="cursor-pointer text-sm font-semibold text-smoke hover:text-bone">
            Round by round
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[22rem] text-left text-sm tabular-nums">
              <thead className="text-xs text-smoke uppercase">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Round</th>
                  <th className="py-2 pr-4 font-semibold">Map</th>
                  <th className="py-2 pr-4 font-semibold">Place</th>
                  <th className="py-2 pr-4 font-semibold">Kills</th>
                  <th className="py-2 font-semibold">Points</th>
                </tr>
              </thead>
              <tbody>
                {m.rounds.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="py-2 pr-4">{r.round_number}</td>
                    <td className="py-2 pr-4">{r.map_name ?? "-"}</td>
                    <td className="py-2 pr-4">{r.placement ?? "-"}</td>
                    <td className="py-2 pr-4">{r.kills ?? "-"}</td>
                    <td className="py-2">{r.total_points ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      {kind === "results" && m.playerStatistics.length > 0 && (
        <details className="mt-4 md:ml-40 lg:ml-52">
          <summary className="cursor-pointer text-sm font-semibold text-smoke hover:text-bone">Player statistics</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[18rem] text-left text-sm tabular-nums">
              <thead className="text-xs text-smoke uppercase">
                <tr>
                  {["IGN", "Kills", "Assists", "Damage"].map((label) => (
                    <th key={label} scope="col" className="py-2 pr-3 font-semibold">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {m.playerStatistics.map((player) => (
                  <tr key={player.ign} className="border-t border-line">
                    <th scope="row" className="py-2 pr-3 font-medium break-all">{player.ign}</th>
                    <td className="py-2 pr-3">{player.kills ?? "—"}</td>
                    <td className="py-2 pr-3">{player.assists ?? "—"}</td>
                    <td className="py-2 pr-3">{player.damage ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </li>
  );
}

function EmptyBoard({ kind }: { kind: Tab }) {
  const upcoming = kind === "upcoming";
  const Icon = upcoming ? CalendarBlankIcon : TrophyIcon;
  return (
    <div className="grid gap-10 py-20 md:grid-cols-[auto_1fr] md:items-center md:gap-16 md:py-28">
      <div className="relative grid size-40 place-items-center md:size-52" aria-hidden>
        {/* A closing zone, repeating: the board is waiting for the next drop. */}
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full border border-violet"
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: [1, 0.35], opacity: [0, 0.7, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, delay: i * 1.2, ease: "easeIn" }}
          />
        ))}
        <span className="absolute inset-0 rounded-full border border-line" />
        <Icon size={36} className="text-violet" />
      </div>
      <div>
        <h2 className="font-display text-[clamp(2.75rem,6vw,5rem)] leading-[0.86]">
          {upcoming ? "No fixtures yet" : "No results yet"}
        </h2>
        <p className="mt-4 max-w-[48ch] text-lg text-smoke">
          {upcoming
            ? "Confirmed matches appear here with the event, date and start time as soon as an organizer locks them in."
            : "Placements and scores are published here after each event, once the results are verified."}
        </p>
      </div>
    </div>
  );
}
