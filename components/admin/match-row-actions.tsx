"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CopyIcon, EyeIcon, EyeSlashIcon, PauseIcon, PencilSimpleIcon, ProhibitIcon, TrashIcon, TrophyIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { deleteMatch, duplicateMatch, setMatchPublished, setMatchStatus } from "@/app/(admin)/EEAUTHOR/(console)/matches/actions";
import type { MatchStatus } from "@/lib/supabase/types";
import { ActionButton } from "./confirm";
import { RowMenu } from "./row-menu";
import { useToast } from "./toast";

export function MatchRowActions({ id, title, status, published }: { id: string; title: string; status: MatchStatus; published: boolean }) {
  const router = useRouter();
  const toast = useToast();

  return (
    <RowMenu label={`Actions for ${title}`}>
      <Link role="menuitem" href={`/EEAUTHOR/matches/${id}`} className="menu-item">
        <PencilSimpleIcon size={16} aria-hidden /> Edit
      </Link>
      <Link role="menuitem" href={`/EEAUTHOR/matches/${id}#result`} className="menu-item">
        <TrophyIcon size={16} aria-hidden /> {status === "completed" ? "Edit result" : "Enter result"}
      </Link>
      <button
        role="menuitem"
        type="button"
        className="menu-item"
        onClick={async () => {
          const r = await duplicateMatch(id);
          if (r.ok && r.data) {
            toast("success", r.message ?? "Duplicated");
            router.push(`/EEAUTHOR/matches/${r.data.id}`);
          } else if (!r.ok) toast("error", r.message);
        }}
      >
        <CopyIcon size={16} aria-hidden /> Duplicate
      </button>
      <ActionButton className="menu-item" action={() => setMatchPublished(id, !published)}>
        {published ? <EyeSlashIcon size={16} aria-hidden /> : <EyeIcon size={16} aria-hidden />}
        {published ? "Unpublish" : "Publish"}
      </ActionButton>
      {status !== "postponed" && status !== "completed" && (
        <ActionButton className="menu-item" action={() => setMatchStatus(id, "postponed")}>
          <PauseIcon size={16} aria-hidden /> Postpone
        </ActionButton>
      )}
      {status !== "cancelled" && status !== "completed" && (
        <ActionButton
          className="menu-item"
          action={() => setMatchStatus(id, "cancelled")}
          confirm={{ title: "Cancel this match?", body: `${title} will show as cancelled on the website if it is published.`, confirmLabel: "Cancel match", danger: true }}
        >
          <ProhibitIcon size={16} aria-hidden /> Cancel
        </ActionButton>
      )}
      {(status === "postponed" || status === "cancelled") && (
        <ActionButton className="menu-item" action={() => setMatchStatus(id, "upcoming")}>
          <ArrowCounterClockwiseIcon size={16} aria-hidden /> Restore to upcoming
        </ActionButton>
      )}
      <ActionButton
        className="menu-item danger"
        action={() => deleteMatch(id)}
        confirm={{
          title: "Delete this match?",
          body: `${title} and any recorded result will be permanently removed. To hide it instead, unpublish or cancel it.`,
          confirmLabel: "Delete permanently",
          danger: true,
        }}
      >
        <TrashIcon size={16} aria-hidden /> Delete
      </ActionButton>
    </RowMenu>
  );
}
