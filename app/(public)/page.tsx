import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { Statement } from "@/components/home/statement";
import { VelocityMarquee } from "@/components/home/velocity-marquee";
import { RosterPan } from "@/components/home/roster-pan";
import { KitScrub } from "@/components/home/kit-scrub";
import { MatchTeaser } from "@/components/home/match-teaser";
import { Closing } from "@/components/home/closing";
import { getLineup, getMatches, getNextMatch, getSettings } from "@/lib/data/public";
import { siteUrl } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: { absolute: "Epic Elites | Free Fire Esports Team" },
  description:
    "Official home of Epic Elites, a Free Fire esports team. Meet the roster, follow fixtures and results, and explore the black and violet kit.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Epic Elites",
    locale: "en_US",
    title: "Epic Elites | Free Fire Esports Team",
    description: "Meet the roster, follow fixtures and results, and explore the black and violet kit.",
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "Epic Elites | Free Fire Esports Team" },
};

export default async function HomePage() {
  const [settings, lineup, next, matches] = await Promise.all([
    getSettings(),
    getLineup(),
    getNextMatch(),
    getMatches(),
  ]);

  const origin = settings.siteUrl ?? siteUrl;
  const absolute = (u: string) => (u.startsWith("http") ? u : `${origin}${u}`);
  const teamLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: settings.teamName,
    sport: settings.game,
    url: origin,
    logo: absolute("/images/epic-elites-mark.svg"),
    description: settings.description ?? undefined,
    sameAs: settings.socials.map((s) => s.url),
    member: lineup.map((p) => ({ "@type": "Person", name: p.name })),
  };

  return (
    <main id="main">
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
