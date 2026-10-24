import { OG_SIZE, renderOgImage } from "@/lib/og";
import { getNewsBySlug } from "@/lib/data/public";
import { NEWS_CATEGORIES } from "@/lib/labels";

export const alt = "Epic Elites news article";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Share preview for an article: its headline plus category. Drafts never reach here (404). */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getNewsBySlug(slug);
  return renderOgImage({
    title: post?.title ?? "News",
    subtitle: post ? (post.summary ?? NEWS_CATEGORIES[post.category]) : "Official announcements from the team.",
  });
}
