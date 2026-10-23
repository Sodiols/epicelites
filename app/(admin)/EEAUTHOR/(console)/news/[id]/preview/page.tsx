import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { Article } from "@/components/article";
import { NewsStatusBadge } from "@/components/admin/status";
import { uuid } from "@/lib/validations/common";

export const metadata: Metadata = { title: "Preview" };

/** Admin-only preview of any article, including drafts, using the public article layout. */
export default async function NewsPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const admin = await requireAdmin();
  const { data: post } = await admin.supabase.from("news_posts").select("*").eq("id", id).maybeSingle();
  if (!post) notFound();

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-10 lg:-my-8">
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-line bg-graphite px-4 py-2 text-sm">
        <span className="font-semibold">Preview</span>
        <NewsStatusBadge status={post.status} publishedAt={post.published_at} />
        <span className="text-smoke">This is how the article will look. Visitors cannot see it until it is published.</span>
        <Link href={`/EEAUTHOR/news/${post.id}`} className="a-btn a-btn-secondary a-btn-sm ml-auto">
          Back to editor
        </Link>
      </div>
      <div className="-mt-20">
        <Article post={post} preview />
      </div>
    </div>
  );
}
