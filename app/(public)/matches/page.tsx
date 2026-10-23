import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { MatchBoard } from "@/components/match-board";
import { getMatches, getSettings } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Matches & Results",
  description: "Upcoming fixtures and verified results for Epic Elites, a Free Fire esports team.",
  alternates: { canonical: "/matches" },
};

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
    </main>
  );
}
