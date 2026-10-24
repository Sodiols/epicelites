import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";

const PAGES = {
  roster: { href: "/roster", title: "Roster", body: "The players who wear the crest and their profiles." },
  matches: { href: "/matches", title: "Matches", body: "Upcoming fixtures and verified results." },
  media: { href: "/media", title: "Media", body: "The jersey in 3D, photos and videos." },
  news: { href: "/news", title: "News", body: "Official announcements from the team." },
  about: { href: "/about", title: "About", body: "Who we are and what we play by." },
  faq: { href: "/faq", title: "FAQ", body: "Quick answers about the team and the site." },
  contact: { href: "/contact", title: "Contact", body: "Partnerships, invitations and media requests." },
} as const;

export type RelatedKey = keyof typeof PAGES;

const COLS = ["", "sm:grid-cols-1", "sm:grid-cols-2", "sm:grid-cols-3"];

/** End-of-page links to related sections, so every page leads somewhere useful. */
export function RelatedLinks({ pages }: { pages: RelatedKey[] }) {
  return (
    <nav aria-labelledby="related-title" className="mx-auto mt-32 max-w-[1400px] px-4 sm:px-8">
      <h2 id="related-title" className="text-sm font-semibold text-smoke">
        Keep exploring
      </h2>
      <ul className={`mt-4 grid gap-px border border-line bg-line ${COLS[Math.min(pages.length, 3)]}`}>
        {pages.map((key) => {
          const p = PAGES[key];
          return (
            <li key={key} className="bg-night">
              <Link href={p.href} className="group flex h-full items-end justify-between gap-6 p-6 transition-colors hover:bg-carbon sm:p-8">
                <span>
                  <span className="font-display block text-[clamp(2rem,4vw,3rem)] leading-none group-hover:text-violet">{p.title}</span>
                  <span className="mt-2 block text-sm text-smoke">{p.body}</span>
                </span>
                <ArrowRightIcon
                  size={22}
                  aria-hidden
                  className="shrink-0 text-violet transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
