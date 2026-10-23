import { MATCH_FORMATS, ordinal } from "@/lib/labels";
import type { PublicMatch } from "@/lib/supabase/types";

type MatchLike = Pick<
  PublicMatch,
  | "scoring" | "format" | "event_name" | "stage" | "opponent" | "br_placement" | "br_kills"
  | "br_total_points" | "br_rounds_played" | "h2h_team_score" | "h2h_opponent_score" | "h2h_outcome"
>;

/**
 * Battle Royale is a lobby, not a duel: it is presented by tournament and stage. Only
 * head-to-head formats are presented as "Team vs Opponent".
 */
export function matchHeadline(m: MatchLike, teamName: string): { primary: string; versus: string | null } {
  if (m.scoring === "head_to_head") {
    return { primary: teamName, versus: m.opponent?.trim() || "Opponent TBA" };
  }
  return { primary: m.event_name, versus: null };
}

export function matchContext(m: MatchLike): string {
  const parts = m.scoring === "head_to_head" ? [m.event_name, m.stage] : [m.stage, MATCH_FORMATS[m.format]];
  return parts.filter(Boolean).join("  /  ");
}

/** Short, factual result line built only from confirmed fields. Empty when nothing is recorded. */
export function resultParts(m: MatchLike): string[] {
  if (m.scoring === "head_to_head") {
    if (m.h2h_team_score == null || m.h2h_opponent_score == null) return [];
    const outcome = m.h2h_outcome ? m.h2h_outcome[0].toUpperCase() + m.h2h_outcome.slice(1) : null;
    return [outcome, `${m.h2h_team_score} to ${m.h2h_opponent_score}`].filter(Boolean) as string[];
  }
  const parts: string[] = [];
  if (m.br_placement != null) parts.push(`${ordinal(m.br_placement)} place`);
  if (m.br_kills != null) parts.push(`${m.br_kills} kills`);
  if (m.br_total_points != null) parts.push(`${Number(m.br_total_points)} pts`);
  if (m.br_rounds_played != null) parts.push(`${m.br_rounds_played} rounds`);
  return parts;
}
