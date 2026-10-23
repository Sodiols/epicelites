import { Hero } from "@/components/home/hero";
import { Statement } from "@/components/home/statement";
import { VelocityMarquee } from "@/components/home/velocity-marquee";
import { RosterPan } from "@/components/home/roster-pan";
import { KitScrub } from "@/components/home/kit-scrub";
import { MatchTeaser } from "@/components/home/match-teaser";
import { Closing } from "@/components/home/closing";
import { getLineup, getMatches, getNextMatch, getSettings } from "@/lib/data/public";

export default async function HomePage() {
  const [settings, lineup, next, matches] = await Promise.all([
    getSettings(),
    getLineup(),
    getNextMatch(),
    getMatches(),
  ]);

  return (
    <main id="main">
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
