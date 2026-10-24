import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageIntro } from "@/components/page-intro";
import { MatchBoard } from "@/components/match-board";
import { getMatches, getSettings } from "@/lib/data/public";
import { RelatedLinks } from "@/components/related-links";

export const metadata: Metadata = pageMetadata({
  title: "Matches & Results",
  description:
    "Upcoming Free Fire fixtures, live matches and verified results for Epic Elites, with tournament, stage and start times.",
  path: "/matches",
});

export default async function MatchesPage() {
  const [{ upcoming, results, other }, settings] = await Promise.all([getMatches(), getSettings()]);

  return (
    <main id="main" className="pb-24">
      <PageIntro
        title="Matches"
        summary="Every confirmed fixture and verified result, in one place. Nothing is listed until it is official."
      />
      {/* Postponed and cancelled fixtures stay visible on the Upcoming tab, clearly labelled. */}
      <MatchBoard upcoming={[...upcoming, ...other]} results={results} teamName={settings.teamName} />
      <RelatedLinks pages={["roster", "news", "faq"]} />
    </main>
  );
}
