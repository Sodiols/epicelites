import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, MegaphoneSimpleIcon } from "@phosphor-icons/react/ssr";
import { PageIntro } from "@/components/page-intro";
import { ClipReveal } from "@/components/ui/clip-reveal";
import { NewsCard } from "@/components/news-card";
import { getFeaturedNews, getNewsPage, NEWS_PAGE_SIZE } from "@/lib/data/public";
import { NEWS_CATEGORIES } from "@/lib/labels";
import { formatDate } from "@/lib/time";
import { RelatedLinks } from "@/components/related-links";

export const metadata: Metadata = pageMetadata({
  title: "News",
  description:
    "Official Epic Elites announcements: roster confirmations, tournament entries, results and team updates.",
  path: "/news",
});

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const [featured, { posts, total }] = await Promise.all([page === 1 ? getFeaturedNews() : null, getNewsPage(page)]);
  const list = featured ? posts.filter((p) => p.id !== featured.id) : posts;
  const pages = Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE));

  return (
    <main id="main" className="pb-24">
      <PageIntro
        title="News"
        summary="Official announcements from the team. Roster confirmations, tournament entries and kit drops land here first."
      />

      {featured && (
        <article className="relative mx-auto mt-16 grid max-w-[1400px] items-center gap-10 px-4 sm:px-8 lg:grid-cols-12 lg:gap-16">
          <div className="chamfer relative aspect-[16/11] bg-carbon [--cut:32px] lg:col-span-7">
            {featured.cover_url && (
              <ClipReveal className="absolute inset-0">
                <Image
                  src={featured.cover_url}
                  alt={featured.cover_alt ?? ""}
                  fill
                  priority
                  sizes="(min-width: 1024px) 55vw, 92vw"
                  className="object-cover"
                />
              </ClipReveal>
            )}
          </div>
          <div className="lg:col-span-5">
            <p className="flex flex-wrap gap-x-3 text-sm font-semibold">
              <span className="text-violet">Featured</span>
              <span className="text-smoke">{NEWS_CATEGORIES[featured.category]}</span>
            </p>
            <h2 className="font-display mt-3 text-[clamp(2.75rem,5vw,4.75rem)] leading-[0.88]">{featured.title}</h2>
            {featured.summary && <p className="mt-5 max-w-[42ch] text-lg text-smoke">{featured.summary}</p>}
            {featured.published_at && (
              <p className="mt-3 font-mono text-sm text-smoke">
                <time dateTime={featured.published_at}>{formatDate(featured.published_at)}</time>
              </p>
            )}
            <Link href={`/news/${featured.slug}`} className="btn btn-primary group mt-8">
              Read the story
              <ArrowRightIcon
                size={16}
                weight="bold"
                aria-hidden
                className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
              />
            </Link>
          </div>
        </article>
      )}

      <section aria-labelledby="latest-title" className="mx-auto mt-32 max-w-[1400px] px-4 sm:px-8">
        <h2 id="latest-title" className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.88]">
          Latest announcements
        </h2>

        {list.length > 0 ? (
          <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((post) => (
              <NewsCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          !featured && (
            <div className="frame mt-10 flex flex-col items-start gap-6 p-8 [--cut:24px] sm:flex-row sm:items-center sm:p-12">
              <span className="grid size-16 shrink-0 place-items-center border border-line text-violet">
                <MegaphoneSimpleIcon size={28} aria-hidden />
              </span>
              <div>
                <h3 className="text-2xl font-semibold">Nothing announced yet</h3>
                <p className="mt-2 max-w-[56ch] text-smoke">
                  The first official update will be posted here. Fixtures are tracked separately in the{" "}
                  <Link href="/matches" className="link-underline text-bone hover:text-violet">
                    match center
                  </Link>
                  .
                </p>
              </div>
            </div>
          )
        )}

        {pages > 1 && (
          <nav aria-label="News pages" className="mt-16 flex items-center justify-between gap-4 border-t border-line pt-6">
            {page > 1 ? (
              <Link href={page === 2 ? "/news" : `/news?page=${page - 1}`} className="btn btn-ghost">
                <ArrowLeftIcon size={16} aria-hidden />
                Newer
              </Link>
            ) : (
              <span />
            )}
            <span className="font-mono text-sm text-smoke tabular-nums">
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <Link href={`/news?page=${page + 1}`} className="btn btn-ghost">
                Older
                <ArrowRightIcon size={16} aria-hidden />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>
      <RelatedLinks pages={["matches", "roster", "media"]} />
    </main>
  );
}
