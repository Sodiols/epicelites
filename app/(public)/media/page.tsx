import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { PageIntro } from "@/components/page-intro";
import { JerseyViewer } from "@/components/media/jersey-viewer";
import { Gallery } from "@/components/media/gallery";
import { getMatches, getMedia, getNewsPage, getSettings, type MediaItem } from "@/lib/data/public";
import { RelatedLinks } from "@/components/related-links";
import { NewsCard } from "@/components/news-card";
import { youTubeId } from "@/lib/video";

export const metadata: Metadata = pageMetadata({
  title: "Media & Kit",
  description:
    "Turn the official Epic Elites black and violet jersey in 3D and browse team photos, graphics and videos.",
  path: "/media",
});

export default async function MediaPage() {
  const [settings, { results }, media, { posts }, { posts: rosterPosts }] = await Promise.all([
    getSettings(), getMatches(), getMedia(), getNewsPage(1), getNewsPage(1, "roster_announcements"),
  ]);
  const updates = posts.slice(0, 3);
  const rosterUpdate = rosterPosts[0];
  if (rosterUpdate && !updates.some((post) => post.id === rosterUpdate.id)) {
    updates.splice(2, 1, rosterUpdate);
  }
  const videoIds = new Set(media.map((item) => item.video_url && youTubeId(item.video_url)));
  const replays: MediaItem[] = [];
  for (const match of results) {
    const id = match.stream_url && youTubeId(match.stream_url);
    if (!id || videoIds.has(id)) continue;
    videoIds.add(id);
    replays.push({
      id: `replay-${match.id}`,
      kind: "video",
      category: "tournament",
      collection: null,
      title: `${match.event_name} replay`,
      caption: null,
      alt_text: null,
      url: null,
      width: null,
      height: null,
      on_black: false,
      video_url: match.stream_url,
      is_featured: false,
      display_order: 0,
      created_at: match.starts_at,
    });
  }

  return (
    <main id="main" className="pb-24">
      <PageIntro title="Media" summary="Tournament photos, match replays, team updates and the black-and-violet kit." />
      <section aria-label="Jersey viewer" className="mx-auto mt-16 max-w-[1400px] px-4 sm:px-8">
        <JerseyViewer
          front={settings.jerseyFrontUrl}
          back={settings.jerseyBackUrl}
          edition={settings.jerseyEditionLabel}
        />
      </section>
      <section aria-labelledby="gallery-title" className="mx-auto mt-32 max-w-[1400px] px-4 sm:px-8">
        <h2 id="gallery-title" className="font-display mb-10 text-[clamp(3rem,6vw,5.5rem)] leading-[0.86]">
          Gallery
        </h2>
        <Gallery items={[...media.filter((item) => item.is_featured), ...replays, ...media.filter((item) => !item.is_featured)]} />
      </section>
      <section aria-labelledby="updates-title" className="mx-auto mt-32 max-w-[1400px] px-4 sm:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 id="updates-title" className="font-display text-[clamp(3rem,6vw,5.5rem)] leading-[0.86]">
            Team updates
          </h2>
          <Link href="/news" className="btn btn-ghost">All team news</Link>
        </div>
        {updates.length > 0 && (
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {updates.map((post) => <NewsCard key={post.id} post={post} />)}
          </div>
        )}
        {settings.socials.length > 0 && (
          <ul aria-label="Official Epic Elites channels" className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
            {settings.socials.map(({ network, url }) => (
              <li key={network}>
                <a className="btn btn-ghost capitalize" href={url} target="_blank" rel="noopener noreferrer">
                  {network === "youtube" ? "YouTube" : network === "tiktok" ? "TikTok" : network}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
      <RelatedLinks pages={["roster", "news", "about"]} />
    </main>
  );
}
