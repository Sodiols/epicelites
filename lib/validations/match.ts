import { z } from "zod";
import { assetUrl, checkbox, optionalHttpsUrl, optionalInt, optionalNumber, optionalText, requiredText } from "./common";
import { isValidTimeZone, zonedInputToUtc } from "@/lib/time";

export const matchSchema = z
  .object({
    event_name: requiredText(120, "Enter the tournament or event name."),
    format: z.enum(["battle_royale", "clash_squad", "scrim", "other"], { message: "Choose a match format." }),
    scoring: z.enum(["placement", "head_to_head"]).optional(),
    stage: optionalText(80),
    opponent: optionalText(80),
    organizer: optionalText(80),
    starts_local: z.string().min(1, "Choose the date and start time."),
    time_zone: z.string().refine(isValidTimeZone, "Choose a valid time zone."),
    description: optionalText(2000),
    stream_url: optionalHttpsUrl,
    info_url: optionalHttpsUrl,
    status: z.enum(["upcoming", "live", "completed", "postponed", "cancelled"]),
    is_published: checkbox,
    is_featured: checkbox,
    cover_url: assetUrl.optional().transform((v) => v ?? null),
    cover_path: optionalText(300),
  })
  .transform((v, ctx) => {
    const startsAt = zonedInputToUtc(v.starts_local, v.time_zone);
    if (!startsAt) {
      ctx.addIssue({ code: "custom", path: ["starts_local"], message: "Choose a valid date and time." });
      return z.NEVER;
    }
    // Battle Royale is always a placement table; Clash Squad is always head-to-head.
    const scoring =
      v.format === "battle_royale" ? "placement" : v.format === "clash_squad" ? "head_to_head" : (v.scoring ?? "placement");
    const { starts_local: _local, ...rest } = v;
    return { ...rest, scoring, starts_at: startsAt.toISOString() } as const;
  });

export type MatchInput = z.infer<typeof matchSchema>;

export const placementResultSchema = z.object({
  br_placement: optionalInt(1, 100),
  br_kills: optionalInt(0, 1000),
  br_placement_points: optionalNumber(0, 100000),
  br_kill_points: optionalNumber(0, 100000),
  br_total_points: optionalNumber(0, 100000),
  br_rounds_played: optionalInt(0, 100),
  result_notes: optionalText(1000),
});

export const headToHeadResultSchema = z.object({
  h2h_team_score: optionalInt(0, 100),
  h2h_opponent_score: optionalInt(0, 100),
  h2h_outcome: z
    .enum(["win", "loss", "draw", ""])
    .optional()
    .transform((v) => (v ? v : null)),
  result_notes: optionalText(1000),
});

export const roundSchema = z.object({
  round_number: z.number().int().min(1).max(50),
  map_name: z.string().trim().max(40).nullable(),
  placement: z.number().int().min(1).max(100).nullable(),
  kills: z.number().int().min(0).max(200).nullable(),
  placement_points: z.number().min(0).max(100000).nullable(),
  kill_points: z.number().min(0).max(100000).nullable(),
  total_points: z.number().min(0).max(100000).nullable(),
});

/** Reads rows posted as round[0][map_name], round[0][kills], ... into typed round objects. */
export function parseRounds(form: FormData): { rounds: z.infer<typeof roundSchema>[]; error: string | null } {
  const rows = new Map<number, Record<string, string>>();
  for (const [key, value] of form.entries()) {
    const m = /^round\[(\d+)\]\[(\w+)\]$/.exec(key);
    if (!m || typeof value !== "string") continue;
    const i = Number(m[1]);
    rows.set(i, { ...(rows.get(i) ?? {}), [m[2]]: value.trim() });
  }
  const num = (v: string | undefined, int: boolean) => {
    if (!v) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return Number.NaN;
    return int ? n : Math.round(n * 100) / 100;
  };
  const rounds: z.infer<typeof roundSchema>[] = [];
  let position = 0;
  for (const [, r] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    const empty = !r.map_name && !r.placement && !r.kills && !r.placement_points && !r.kill_points && !r.total_points;
    if (empty) continue;
    position++;
    const parsed = roundSchema.safeParse({
      round_number: position,
      map_name: r.map_name || null,
      placement: num(r.placement, true),
      kills: num(r.kills, true),
      placement_points: num(r.placement_points, false),
      kill_points: num(r.kill_points, false),
      total_points: num(r.total_points, false),
    });
    if (!parsed.success) return { rounds: [], error: `Round ${position} has an invalid value. Use whole numbers for placement and kills.` };
    rounds.push(parsed.data);
  }
  return { rounds, error: null };
}
