import { Badge } from "./ui";
import { MATCH_STATUSES } from "@/lib/labels";
import type { MatchStatus, NewsStatus } from "@/lib/supabase/types";

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const tone = { upcoming: "violet", live: "solid", completed: "green", postponed: "amber", cancelled: "red" } as const;
  return <Badge tone={tone[status]}>{MATCH_STATUSES[status]}</Badge>;
}

export function PublishBadge({ published }: { published: boolean }) {
  return published ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>;
}

export function newsState(status: NewsStatus, publishedAt: string | null, now = Date.now()) {
  if (status === "published" && publishedAt && new Date(publishedAt).getTime() > now) return "scheduled" as const;
  return status;
}

export function NewsStatusBadge({ status, publishedAt }: { status: NewsStatus; publishedAt: string | null }) {
  const state = newsState(status, publishedAt);
  const map = {
    draft: <Badge>Draft</Badge>,
    scheduled: <Badge tone="amber">Scheduled</Badge>,
    published: <Badge tone="green">Published</Badge>,
    archived: <Badge tone="red">Archived</Badge>,
  };
  return map[state];
}
