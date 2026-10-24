import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon } from "@phosphor-icons/react/ssr";
import { pageMetadata } from "@/lib/seo";
import { RelatedLinks } from "@/components/related-links";
import { TrackEvent } from "@/components/track-event";

// A confirmation screen, not a destination: kept out of search results and the sitemap.
export const metadata: Metadata = pageMetadata({
  title: "Message sent",
  description: "Thanks for contacting Epic Elites. Your message is in the team inbox.",
  path: "/contact/thank-you",
  noindex: true,
});

export default function ThankYouPage() {
  return (
    <main id="main" className="pb-24">
      <TrackEvent name="generate_lead" params={{ form: "contact" }} />
      <section className="relative mx-auto grid min-h-[70dvh] max-w-[1400px] content-center px-4 pt-32 sm:px-8 md:pt-40">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-[-10vmin] hidden size-[70vmin] -translate-y-1/2 rounded-full border border-violet/40 md:block"
        />
        <CheckCircleIcon size={56} weight="fill" className="text-violet" aria-hidden />
        <h1 className="font-display mt-6 text-[clamp(4rem,12vw,10rem)] leading-[0.82]">
          Thank <span className="text-violet">you</span>
        </h1>
        <p className="mt-6 max-w-[44ch] text-xl text-smoke">
          Your message is in the Epic Elites inbox. The team replies to the email address you gave, so keep an eye on it,
          including your spam folder.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-primary group">
            Back to home
            <ArrowRightIcon
              size={16}
              weight="bold"
              aria-hidden
              className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
            />
          </Link>
          <Link href="/contact" className="btn btn-ghost">
            Send another message
          </Link>
        </div>
      </section>
      <RelatedLinks pages={["matches", "roster", "news"]} />
    </main>
  );
}
