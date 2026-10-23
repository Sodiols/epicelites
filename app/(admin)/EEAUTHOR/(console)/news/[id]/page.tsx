import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader } from "@/components/admin/ui";
import { NewsForm } from "@/components/admin/news-form";
import { uuid } from "@/lib/validations/common";

export const metadata: Metadata = { title: "Edit news" };

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const admin = await requireAdmin();
  const { data: post } = await admin.supabase.from("news_posts").select("*").eq("id", id).maybeSingle();
  if (!post) notFound();
  return (
    <div className="grid gap-8">
      <PageHeader title="Edit article" back={{ href: "/EEAUTHOR/news", label: "News" }} description={post.title} />
      <NewsForm post={post} />
    </div>
  );
}
