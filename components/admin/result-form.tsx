"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { saveResult } from "@/app/(admin)/EEAUTHOR/(console)/matches/actions";
import type { MatchRow, RoundRow } from "@/lib/supabase/types";
import { FormError, SelectField, TextAreaField, TextField } from "./fields";
import { useActionForm } from "./use-action-form";
import { Badge } from "./ui";
import { snappy } from "@/lib/motion";

type Round = { key: number; map_name: string; placement: string; kills: string; placement_points: string; kill_points: string; total_points: string };

const str = (v: number | string | null | undefined) => (v === null || v === undefined ? "" : String(v));

/**
 * Turns an existing scheduled match into a result without recreating it. Saving keeps
 * the result private; confirming marks it verified and publishes it.
 */
export function ResultForm({ match, rounds: initialRounds }: { match: MatchRow; rounds: RoundRow[] }) {
  const { formProps, pending, errors, formError } = useActionForm(saveResult);
  const placement = match.scoring === "placement";
  let nextKey = 0;
  const [rounds, setRounds] = useState<Round[]>(() =>
    initialRounds.map((r) => ({
      key: nextKey++,
      map_name: r.map_name ?? "",
      placement: str(r.placement),
      kills: str(r.kills),
      placement_points: str(r.placement_points),
      kill_points: str(r.kill_points),
      total_points: str(r.total_points),
    })),
  );
  const [keySeq, setKeySeq] = useState(initialRounds.length);
  const [team, setTeam] = useState(str(match.h2h_team_score));
  const [opp, setOpp] = useState(str(match.h2h_opponent_score));

  const sum = (field: "kills" | "placement_points" | "kill_points" | "total_points") =>
    rounds.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
  const suggestedOutcome = team !== "" && opp !== "" ? (Number(team) > Number(opp) ? "win" : Number(team) < Number(opp) ? "loss" : "draw") : "";

  const update = (key: number, field: keyof Round, value: string) =>
    setRounds((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  return (
    <form {...formProps} className="grid gap-6">
      <input type="hidden" name="id" value={match.id} />
      <div className="flex flex-wrap items-center gap-2">
        {match.result_confirmed ? (
          <Badge tone="green">Confirmed and public</Badge>
        ) : match.status === "completed" ? (
          <Badge tone="amber">Saved, awaiting confirmation</Badge>
        ) : (
          <Badge>No result yet</Badge>
        )}
        <span className="text-xs text-smoke">Results are never published automatically when the start time passes.</span>
      </div>
      <FormError message={formError} />

      {placement ? (
        <>
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField label="Overall placement" name="br_placement" type="number" inputMode="numeric" min={1} max={100} defaultValue={str(match.br_placement)} error={errors.br_placement} />
            <TextField label="Total kills" name="br_kills" type="number" inputMode="numeric" min={0} defaultValue={str(match.br_kills)} error={errors.br_kills} help={rounds.length ? `Rounds add up to ${sum("kills")}` : undefined} />
            <TextField label="Rounds played" name="br_rounds_played" type="number" inputMode="numeric" min={0} defaultValue={str(match.br_rounds_played)} error={errors.br_rounds_played} />
            <TextField label="Placement points" name="br_placement_points" type="number" inputMode="decimal" step="0.01" min={0} defaultValue={str(match.br_placement_points)} error={errors.br_placement_points} help={rounds.length ? `Rounds add up to ${sum("placement_points")}` : undefined} />
            <TextField label="Kill points" name="br_kill_points" type="number" inputMode="decimal" step="0.01" min={0} defaultValue={str(match.br_kill_points)} error={errors.br_kill_points} help={rounds.length ? `Rounds add up to ${sum("kill_points")}` : undefined} />
            <TextField label="Total points" name="br_total_points" type="number" inputMode="decimal" step="0.01" min={0} defaultValue={str(match.br_total_points)} error={errors.br_total_points} help={rounds.length ? `Rounds add up to ${sum("total_points")}` : undefined} />
          </div>

          <fieldset className="grid gap-3">
            <legend className="a-label mb-2">Map by map (optional)</legend>
            {rounds.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-smoke">
                      <th className="w-10 py-1.5 font-semibold">#</th>
                      <th className="py-1.5 font-semibold">Map</th>
                      <th className="py-1.5 font-semibold">Place</th>
                      <th className="py-1.5 font-semibold">Kills</th>
                      <th className="py-1.5 font-semibold">Place pts</th>
                      <th className="py-1.5 font-semibold">Kill pts</th>
                      <th className="py-1.5 font-semibold">Total</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {rounds.map((r, i) => (
                        <motion.tr key={r.key} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={snappy}>
                          <td className="py-1 font-mono text-smoke tabular-nums">{i + 1}</td>
                          {(["map_name", "placement", "kills", "placement_points", "kill_points", "total_points"] as const).map((f) => (
                            <td key={f} className="py-1 pr-1.5">
                              <input
                                name={`round[${i}][${f}]`}
                                aria-label={`Round ${i + 1} ${f.replace("_", " ")}`}
                                type={f === "map_name" ? "text" : "number"}
                                inputMode={f === "map_name" ? undefined : "decimal"}
                                step={f.endsWith("points") ? "0.01" : "1"}
                                min={f === "map_name" ? undefined : 0}
                                maxLength={f === "map_name" ? 40 : undefined}
                                value={r[f]}
                                onChange={(e) => update(r.key, f, e.target.value)}
                                className="a-input min-h-9 px-2"
                              />
                            </td>
                          ))}
                          <td className="py-1">
                            <button type="button" className="a-btn a-btn-ghost a-btn-icon" aria-label={`Remove round ${i + 1}`} onClick={() => setRounds((rs) => rs.filter((x) => x.key !== r.key))}>
                              <TrashIcon size={16} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
            <button
              type="button"
              className="a-btn a-btn-secondary a-btn-sm justify-self-start"
              onClick={() => {
                setRounds((rs) => [...rs, { key: keySeq, map_name: "", placement: "", kills: "", placement_points: "", kill_points: "", total_points: "" }]);
                setKeySeq((k) => k + 1);
              }}
            >
              <PlusIcon size={14} aria-hidden />
              Add round
            </button>
          </fieldset>
        </>
      ) : (
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField label="Epic Elites score" name="h2h_team_score" type="number" inputMode="numeric" min={0} value={team} onChange={(e) => setTeam(e.target.value)} error={errors.h2h_team_score} />
          <TextField label={`${match.opponent ?? "Opponent"} score`} name="h2h_opponent_score" type="number" inputMode="numeric" min={0} value={opp} onChange={(e) => setOpp(e.target.value)} error={errors.h2h_opponent_score} />
          <SelectField
            label="Outcome"
            name="h2h_outcome"
            key={suggestedOutcome}
            defaultValue={match.h2h_outcome ?? suggestedOutcome}
            options={[
              { value: "", label: "Not set" },
              { value: "win", label: "Win" },
              { value: "loss", label: "Loss" },
              { value: "draw", label: "Draw" },
            ]}
            help={suggestedOutcome ? `Scores suggest a ${suggestedOutcome}.` : undefined}
          />
        </div>
      )}

      <TextAreaField label="Internal notes" name="result_notes" rows={2} maxLength={1000} defaultValue={match.result_notes ?? ""} help="Source of the result, screenshot reference. Never shown publicly." />

      <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        {match.result_confirmed && (
          <button type="submit" name="intent" value="unconfirm" className="a-btn a-btn-ghost" disabled={pending}>
            Withdraw confirmation
          </button>
        )}
        <button type="submit" name="intent" value="save" className="a-btn a-btn-secondary" disabled={pending}>
          Save without publishing
        </button>
        <button type="submit" name="intent" value="confirm" className="a-btn a-btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Confirm and publish result"}
        </button>
      </div>
    </form>
  );
}
