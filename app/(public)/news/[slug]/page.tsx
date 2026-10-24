import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNewsBySlug, getSettings } from "@/lib/data/public";
import { markdownToText } from "@/lib/markdown";
import { siteUrl } from "@/lib/supabase/env";
import { Article } from "@/components/article";

// Articles render on first request and are then cached like every public page. Drafts and
// future-scheduled posts are not in public_news, so they 404 for visitors.
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsBySlug(slug);
  if (!post) return { title: "Article not found", robots: { index: false } };

  const description = post.seo_description || post.summary || markdownToText(post.body);
  const title = post.seo_title || post.title;
  return {
    title,
    description,
    alternates: { canonical: `/news/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: post.author_name ? [post.author_name] : undefined,
      url: `/news/${post.slug}`,
      siteName: "Epic Elites",
    },
    // The share image comes from ./opengraph-image.tsx (headline on the branded card).
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getNewsBySlug(slug), getSettings()]);
  if (!post) notFound();

  const origin = settings.siteUrl ?? siteUrl;
  const absolute = (u: string) => (u.startsWith("http") ? u : `${origin}${u}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.summary ?? undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    image: post.cover_url ? [absolute(post.cover_url)] : undefined,
    author: { "@type": post.author_name ? "Person" : "Organization", name: post.author_name ?? settings.teamName },
    publisher: { "@type": "Organization", name: settings.teamName, logo: { "@type": "ImageObject", url: absolute(settings.logoUrl) } },
    mainEntityOfPage: `${origin}/news/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot break out of the script element.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Article post={post} />
    </>
  );
}
