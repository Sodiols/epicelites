"use server";

import { revalidatePath } from "next/cache";
import { authorize, type ActionResult } from "@/lib/auth/admin";
import { uuid } from "@/lib/validations/common";
import type { MessageStatus } from "@/lib/supabase/types";

export async function setMessageStatus(id: string, status: MessageStatus): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  if (!uuid.safeParse(id).success || !["unread", "read", "archived"].includes(status)) return { ok: false, message: "Unknown message." };
  const now = new Date().toISOString();
  const { error } = await auth.admin.supabase
    .from("contact_messages")
    .update({
      status,
      ...(status === "read" ? { read_at: now } : {}),
      ...(status === "archived" ? { archived_at: now } : { archived_at: null }),
      ...(status === "unread" ? { read_at: null } : {}),
    })
    .eq("id", id);
  if (error) return { ok: false, message: "The message could not be updated." };
  revalidatePath("/EEAUTHOR", "layout");
  return { ok: true, message: { unread: "Marked as unread", read: "Marked as read", archived: "Message archived" }[status] };
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return auth.result;
  if (!uuid.safeParse(id).success) return { ok: false, message: "Unknown message." };
  const { error } = await auth.admin.supabase.from("contact_messages").delete().eq("id", id);
  if (error) return { ok: false, message: "The message could not be deleted." };
  revalidatePath("/EEAUTHOR", "layout");
  return { ok: true, message: "Message deleted" };
}
