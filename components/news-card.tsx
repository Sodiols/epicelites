import Image from "next/image";
import Link from "next/link";
import type { NewsPost } from "@/lib/data/public";
import { NEWS_CATEGORIES } from "@/lib/labels";
import { formatDate } from "@/lib/time";

export function NewsCard({ post }: { post: NewsPost }) {
  return (
    <article className="group relative">
      <div className="chamfer relative aspect-[16/10] overflow-hidden bg-carbon [--cut:20px]">
        {post.cover_url ? (
          <Image
            src={post.cover_url}
            alt={post.cover_alt ?? ""}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
            className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
          />
        ) : (
          <span aria-hidden className="font-display absolute inset-0 grid place-items-center text-6xl text-graphite">
            EE
          </span>
        )}
      </div>
      <p className="mt-4 flex flex-wrap gap-x-3 text-sm text-smoke">
        <span className="font-semibold text-violet">{NEWS_CATEGORIES[post.category]}</span>
        {post.published_at && <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>}
      </p>
      <h3 className="mt-2 text-2xl leading-tight font-semibold">
        <Link href={`/news/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-violet">
          {post.title}
        </Link>
      </h3>
      {post.summary && <p className="mt-2 line-clamp-3 text-smoke">{post.summary}</p>}
    </article>
  );
}
