import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { Statement } from "@/components/home/statement";
import { VelocityMarquee } from "@/components/home/velocity-marquee";
import { RosterPan } from "@/components/home/roster-pan";
import { KitScrub } from "@/components/home/kit-scrub";
import { MatchTeaser } from "@/components/home/match-teaser";
import { Closing } from "@/components/home/closing";
import { getLineup, getMatches, getNextMatch, getSettings } from "@/lib/data/public";
import { getSiteOrigin, SITE_NAME } from "@/lib/site-identity";

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} | Free Fire Esports Team` },
  description:
    "Official home of Epic Elites, a Free Fire esports team. Meet the roster, follow fixtures and results, and explore the black and violet kit.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: `${SITE_NAME} | Free Fire Esports Team`,
    description: "Meet the roster, follow fixtures and results, and explore the black and violet kit.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Free Fire Esports Team`,
    description: "Meet the roster, follow fixtures and results, and explore the black and violet kit.",
  },
};

export default async function HomePage() {
  const [settings, lineup, next, matches] = await Promise.all([
    getSettings(),
    getLineup(),
    getNextMatch(),
    getMatches(),
  ]);

  const origin = getSiteOrigin(settings.siteUrl);
  const absolute = (u: string) => new URL(u, `${origin}/`).href;
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    name: SITE_NAME,
    alternateName: "Epic Elites",
    url: `${origin}/`,
    publisher: { "@id": `${origin}/#team` },
    inLanguage: "en",
  };
  const teamLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    "@id": `${origin}/#team`,
    name: SITE_NAME,
    sport: settings.game,
    url: `${origin}/`,
    logo: absolute(settings.logoUrl),
    description: settings.description ?? undefined,
    sameAs: settings.socials.map((s) => s.url),
    member: lineup.map((p) => ({ "@type": "Person", name: p.name })),
  };

  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(teamLd).replace(/</g, "\\u003c") }} />
      <Hero subtitle={settings.heroSubtitle} />
      <Statement text={settings.statement} logoUrl={settings.logoUrl} />
      <VelocityMarquee logoUrl={settings.logoUrl} />
      {lineup.length > 0 && <RosterPan players={lineup} />}
      <KitScrub front={settings.jerseyFrontUrl} back={settings.jerseyBackUrl} />
      <MatchTeaser next={next} latest={matches.results[0] ?? null} teamName={settings.teamName} />
      <Closing />
    </main>
  );
}
