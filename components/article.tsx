import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { NEWS_CATEGORIES } from "@/lib/labels";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/time";
import type { NewsCategory } from "@/lib/supabase/types";

type ArticleData = {
  title: string;
  summary: string | null;
  body: string;
  cover_url: string | null;
  cover_alt: string | null;
  category: NewsCategory;
  author_name: string | null;
  published_at: string | null;
};

/** Article layout shared by the public page and the dashboard preview. */
export function Article({ post, preview = false }: { post: ArticleData; preview?: boolean }) {
  return (
    <main id="main" className="pb-24">
      <article className="mx-auto max-w-[1400px] px-4 pt-32 sm:px-8 md:pt-40">
        {!preview && (
          <Link href="/news" className="link-underline inline-flex items-center gap-2 pb-1 text-sm font-semibold text-smoke hover:text-bone">
            <ArrowLeftIcon size={14} aria-hidden />
            All news
          </Link>
        )}
        <header className="mt-8 max-w-[60rem]">
          <p className="flex flex-wrap gap-x-3 text-sm font-semibold">
            <span className="text-violet">{NEWS_CATEGORIES[post.category]}</span>
            {post.published_at && (
              <time dateTime={post.published_at} className="text-smoke">
                {formatDate(post.published_at)}
              </time>
            )}
            {post.author_name && <span className="text-smoke">By {post.author_name}</span>}
          </p>
          <h1 className="font-display mt-4 text-[clamp(3rem,7vw,6.5rem)] leading-[0.86]">{post.title}</h1>
          {post.summary && <p className="mt-6 max-w-[48ch] text-xl text-smoke">{post.summary}</p>}
        </header>

        {post.cover_url && (
          <div className="chamfer relative mt-12 aspect-[16/9] overflow-hidden bg-carbon [--cut:32px]">
            <Image src={post.cover_url} alt={post.cover_alt ?? ""} fill priority sizes="(min-width: 1400px) 1340px, 100vw" className="object-cover" />
          </div>
        )}

        <div
          className="article-body mx-auto mt-14 max-w-[42rem]"
          // renderMarkdown escapes all input and only emits an allow-listed set of tags.
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
        />
      </article>
    </main>
  );
}
