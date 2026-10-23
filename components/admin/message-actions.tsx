"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArchiveIcon, EnvelopeIcon, EnvelopeOpenIcon, TrashIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { deleteMessage, setMessageStatus } from "@/app/(admin)/EEAUTHOR/(console)/messages/actions";
import type { MessageStatus } from "@/lib/supabase/types";
import { ActionButton } from "./confirm";

/** Opening an unread message marks it read once, the way an inbox should behave. */
export function MarkReadOnOpen({ id, status }: { id: string; status: MessageStatus }) {
  const router = useRouter();
  const done = useRef<string | null>(null);
  useEffect(() => {
    if (status !== "unread" || done.current === id) return;
    done.current = id;
    setMessageStatus(id, "read").then((r) => r.ok && router.refresh());
  }, [id, status, router]);
  return null;
}

export function MessageActions({ id, status, replyHref }: { id: string; status: MessageStatus; replyHref: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <a href={replyHref} className="a-btn a-btn-primary">
        <PaperPlaneTiltIcon size={16} aria-hidden />
        Reply in your email app
      </a>
      {status === "unread" ? (
        <ActionButton action={() => setMessageStatus(id, "read")}>
          <EnvelopeOpenIcon size={16} aria-hidden /> Mark as read
        </ActionButton>
      ) : (
        <ActionButton action={() => setMessageStatus(id, "unread")}>
          <EnvelopeIcon size={16} aria-hidden /> Mark as unread
        </ActionButton>
      )}
      {status !== "archived" ? (
        <ActionButton action={() => setMessageStatus(id, "archived")}>
          <ArchiveIcon size={16} aria-hidden /> Archive
        </ActionButton>
      ) : (
        <ActionButton action={() => setMessageStatus(id, "read")}>
          <EnvelopeOpenIcon size={16} aria-hidden /> Move to inbox
        </ActionButton>
      )}
      <ActionButton
        className="a-btn a-btn-danger"
        action={() => deleteMessage(id)}
        redirectTo="/EEAUTHOR/messages"
        confirm={{ title: "Delete this message?", body: "It is removed permanently, including the sender's details.", confirmLabel: "Delete", danger: true }}
      >
        <TrashIcon size={16} aria-hidden /> Delete
      </ActionButton>
    </div>
  );
}
