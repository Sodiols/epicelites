import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageIntro } from "@/components/page-intro";
import { MatchBoard } from "@/components/match-board";
import { getMatchCenter } from "@/lib/data/public";
import { RelatedLinks } from "@/components/related-links";

export const metadata: Metadata = pageMetadata({
  title: "Matches & Results",
  description:
    "Upcoming Free Fire fixtures, live matches and verified results for Epic Elites, with tournament, stage and start times.",
  path: "/matches",
});

export default async function MatchesPage() {
  const { fixtures, results, settings } = await getMatchCenter(true);

  return (
    <main id="main" className="pb-24">
      <PageIntro
        title="Matches"
        summary="Follow confirmed fixtures and browse verified tournament results, round scores and player statistics."
      />
      <MatchBoard upcoming={fixtures} results={results} teamName={settings.teamName} />
      <RelatedLinks pages={["roster", "news", "faq"]} />
    </main>
  );
}
