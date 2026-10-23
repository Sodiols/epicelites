import type { AuditRow } from "@/lib/supabase/types";

const RESOURCES: Record<string, { noun: string; href?: (id: string) => string }> = {
  players: { noun: "Player", href: (id) => `/EEAUTHOR/players/${id}` },
  matches: { noun: "Match", href: (id) => `/EEAUTHOR/matches/${id}` },
  match_round_results: { noun: "Round result" },
  news_posts: { noun: "Article", href: (id) => `/EEAUTHOR/news/${id}` },
  media_items: { noun: "Media item", href: (id) => `/EEAUTHOR/media/${id}` },
  partners: { noun: "Partner", href: (id) => `/EEAUTHOR/partners/${id}` },
  team_settings: { noun: "Website settings", href: () => "/EEAUTHOR/settings" },
  contact_messages: { noun: "Inquiry", href: (id) => `/EEAUTHOR/messages?id=${id}` },
  admin_users: { noun: "Administrator", href: () => "/EEAUTHOR/administrators" },
};

const FIELD_NAMES: Record<string, string> = {
  is_published: "publication",
  is_active: "active",
  is_featured: "featured",
  result_confirmed: "result confirmed",
  starts_at: "start time",
  time_zone: "time zone",
  published_at: "publish time",
  jersey_number: "jersey number",
  display_order: "order",
  display_name: "name",
  photo_url: "photo",
  cover_url: "cover",
  br_placement: "placement",
  br_kills: "kills",
  br_total_points: "total points",
  h2h_team_score: "team score",
  h2h_opponent_score: "opponent score",
};

export const RESOURCE_TYPES = Object.entries(RESOURCES).map(([key, v]) => ({ key, label: v.noun }));

/** Turns a raw audit row into a readable line: "Match updated", "status: upcoming to postponed". */
export function describeActivity(row: AuditRow) {
  const r = RESOURCES[row.resource_type] ?? { noun: row.resource_type };
  const verb = { insert: "created", update: "updated", delete: "deleted" }[row.action] ?? row.action;
  let detail = row.summary ?? "";
  if (row.action === "update" && detail.startsWith("Changed ")) {
    detail = detail
      .slice(8)
      .split(", ")
      .map((part) => {
        const [field, rest] = part.split(": ");
        const name = FIELD_NAMES[field] ?? field.replace(/_/g, " ");
        return rest ? `${name}: ${rest}` : name;
      })
      .join(", ");
  } else if (row.action !== "update") {
    detail = "";
  }
  const href = row.action !== "delete" && row.resource_id && r.href ? r.href(row.resource_id) : null;
  return { title: `${r.noun} ${verb}`, label: row.resource_label, detail, href };
}
