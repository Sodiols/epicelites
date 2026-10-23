import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrashIcon } from "@phosphor-icons/react/ssr";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader } from "@/components/admin/ui";
import { MediaForm } from "@/components/admin/media-form";
import { ActionButton } from "@/components/admin/confirm";
import { deleteMedia } from "../actions";
import { uuid } from "@/lib/validations/common";

export const metadata: Metadata = { title: "Edit media" };

export default async function EditMediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const admin = await requireAdmin();
  const [{ data: item }, { data: players }] = await Promise.all([
    admin.supabase.from("media_items").select("*").eq("id", id).maybeSingle(),
    admin.supabase.from("players").select("id, display_name").order("display_order"),
  ]);
  if (!item) notFound();

  return (
    <div className="grid gap-8">
      <PageHeader
        title={item.title || (item.kind === "video" ? "Video" : "Image")}
        back={{ href: "/EEAUTHOR/media", label: "Media" }}
        actions={
          <ActionButton
            className="a-btn a-btn-danger"
            action={deleteMedia.bind(null, item.id)}
            redirectTo="/EEAUTHOR/media"
            confirm={{ title: "Delete this media item?", body: "The entry and its uploaded file are removed permanently.", confirmLabel: "Delete", danger: true }}
          >
            <TrashIcon size={16} aria-hidden /> Delete
          </ActionButton>
        }
      />
      <MediaForm item={item} players={players ?? []} />
    </div>
  );
}
