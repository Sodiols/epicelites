import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader } from "@/components/admin/ui";
import { MediaForm } from "@/components/admin/media-form";

export const metadata: Metadata = { title: "Add video" };

export default async function NewMediaPage() {
  const admin = await requireAdmin();
  const { data: players } = await admin.supabase.from("players").select("id, display_name").order("display_order");
  return (
    <div className="grid gap-8">
      <PageHeader title="Add video" back={{ href: "/EEAUTHOR/media", label: "Media" }} description="To add images, use Upload Media on the library page." />
      <MediaForm kind="video" players={players ?? []} />
    </div>
  );
}
