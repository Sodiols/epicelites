import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { ScrambleText } from "@/components/ui/scramble-text";
import type { Match } from "@/lib/data/public";
import { matchContext, matchHeadline, resultParts } from "@/lib/match-display";
import { formatMatchTime } from "@/lib/time";

/**
 * The next fixture, or an honest "not announced" state, plus the latest confirmed result.
 * Everything shown comes from published Supabase records; nothing is invented.
 */
export function MatchTeaser({ next, latest, teamName }: { next: Match | null; latest: Match | null; teamName: string }) {
  const headline = next ? matchHeadline(next, teamName) : null;
  const when = next ? formatMatchTime(next.starts_at, next.time_zone) : null;
  const latestParts = latest ? resultParts(latest) : [];

  return (
    <section aria-labelledby="next-match-title" className="px-4 py-24 sm:px-8 md:py-32">
      <div className="frame mx-auto grid max-w-[1400px] gap-10 p-6 [--cut:28px] sm:p-10 md:grid-cols-[1.4fr_1fr] md:p-14">
        <div>
          <h2 id="next-match-title" className="text-sm font-semibold text-smoke">
            {next?.status === "live" ? "Live now" : "Next match"}
          </h2>
          {next && headline && when ? (
            <>
              <p className="font-display mt-4 text-[clamp(2.75rem,7vw,6.5rem)] leading-[0.86]">
                {headline.primary}
                {headline.versus && (
                  <>
                    {" "}
                    <span className="text-smoke">vs</span> {headline.versus}
                  </>
                )}
              </p>
              <p className="mt-4 text-lg text-bone">{matchContext(next) || next.event_name}</p>
              <p className="mt-2 font-mono text-sm text-smoke">
                <time dateTime={next.starts_at}>{when.full}</time>
              </p>
              {next.stream_url && (
                <a
                  href={next.stream_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline mt-5 inline-flex items-center gap-2 font-semibold text-violet"
                >
                  Watch the stream
                  <ArrowRightIcon size={16} aria-hidden />
                </a>
              )}
            </>
          ) : (
            <>
              <p className="font-display mt-4 text-[clamp(3.25rem,9vw,8rem)] leading-[0.84] text-violet">
                <ScrambleText text="To be announced" />
              </p>
              <p className="mt-5 max-w-[42ch] text-smoke">
                Fixtures go up here as soon as an organizer confirms them, with the event, date and start time.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col justify-between gap-8 border-t border-line pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-10">
          <div>
            <h3 className="text-sm font-semibold text-smoke">Latest result</h3>
            {latest ? (
              <>
                <p className="mt-3 text-2xl font-semibold">{latestParts.join("  /  ") || "Result confirmed"}</p>
                <p className="mt-2 text-smoke">
                  {latest.scoring === "head_to_head" && latest.opponent ? `vs ${latest.opponent}, ` : ""}
                  {latest.event_name}
                </p>
              </>
            ) : (
              <p className="mt-3 max-w-[30ch] text-lg">Verified results will be published after each event.</p>
            )}
          </div>
          <Link href="/matches" className="btn btn-ghost group self-start [--btn-bg:var(--color-carbon)]">
            Match center
            <ArrowRightIcon
              size={16}
              aria-hidden
              className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
