import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageIntro } from "@/components/page-intro";
import { JerseyViewer } from "@/components/media/jersey-viewer";
import { Gallery } from "@/components/media/gallery";
import { getMedia, getSettings } from "@/lib/data/public";
import { RelatedLinks } from "@/components/related-links";

export const metadata: Metadata = pageMetadata({
  title: "Media & Kit",
  description:
    "Turn the official Epic Elites black and violet jersey in 3D and browse team photos, graphics and videos.",
  path: "/media",
});

export default async function MediaPage() {
  const [settings, media] = await Promise.all([getSettings(), getMedia()]);

  return (
    <main id="main" className="pb-24">
      <PageIntro title="Media" summary="The kit, the crest and the people wearing them." />
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
        <Gallery items={media} />
      </section>
      <RelatedLinks pages={["roster", "news", "about"]} />
    </main>
  );
}
