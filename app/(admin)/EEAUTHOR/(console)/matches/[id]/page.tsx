import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader } from "@/components/admin/ui";
import { MatchForm } from "@/components/admin/match-form";
import { ResultForm } from "@/components/admin/result-form";
import { MatchStatusBadge, PublishBadge } from "@/components/admin/status";
import { MatchRowActions } from "@/components/admin/match-row-actions";
import { uuid } from "@/lib/validations/common";

export const metadata: Metadata = { title: "Edit match" };

export default async function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const admin = await requireAdmin();
  const [{ data: match }, { data: rounds }] = await Promise.all([
    admin.supabase.from("matches").select("*").eq("id", id).maybeSingle(),
    admin.supabase.from("match_round_results").select("*").eq("match_id", id).order("round_number"),
  ]);
  if (!match) notFound();

  const title = match.scoring === "head_to_head" ? `vs ${match.opponent ?? "Opponent TBA"}` : match.event_name;

  return (
    <div className="grid gap-10">
      <PageHeader
        title={title}
        back={{ href: "/EEAUTHOR/matches", label: "Matches" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <MatchStatusBadge status={match.status} />
            <PublishBadge published={match.is_published} />
            {match.stage && <span>{match.stage}</span>}
          </span>
        }
        actions={<MatchRowActions id={match.id} title={title} status={match.status} published={match.is_published} />}
      />
      <MatchForm match={match} />
      <section id="result" aria-labelledby="result-heading" className="a-panel scroll-mt-20 p-5 sm:p-6">
        <h2 id="result-heading" className="font-display text-3xl leading-none">
          Result
        </h2>
        <p className="a-help mt-1 mb-6">
          {match.scoring === "placement"
            ? "Placement-style result: overall placement, kills and points, with optional map-by-map rounds."
            : "Head-to-head result: both scores and the outcome."}
        </p>
        <ResultForm match={match} rounds={rounds ?? []} />
      </section>
    </div>
  );
}
