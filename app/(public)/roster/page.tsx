import type { Metadata } from "next";
import { Suspense } from "react";
import { PageIntro } from "@/components/page-intro";
import { RosterGrid } from "@/components/roster/roster-grid";
import { getPlayers, getSettings } from "@/lib/data/public";
import { pad } from "@/lib/team";

export const metadata: Metadata = {
  title: "Roster",
  description: "Meet the Epic Elites Free Fire roster and open each player's profile.",
  alternates: { canonical: "/roster" },
};

export default async function RosterPage() {
  const [players, settings] = await Promise.all([getPlayers(), getSettings()]);

  return (
    <main id="main" className="pb-40">
      <PageIntro
        title="Roster"
        summary="The players who wear the crest. Open any card for the full profile; names and roles update as the lineup is confirmed."
        aside={
          <p className="font-mono text-sm text-smoke tabular-nums">
            {pad(players.length)} active players
          </p>
        }
      />
      {players.length > 0 ? (
        <Suspense>
          <RosterGrid players={players} teamName={settings.teamName} game={settings.game} />
        </Suspense>
      ) : (
        <p className="mx-auto mt-16 max-w-[1400px] px-4 text-lg text-smoke sm:px-8">
          The lineup is being finalized. Player profiles will appear here once they are announced.
        </p>
      )}
    </main>
  );
}
