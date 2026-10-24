import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { pageMetadata } from "@/lib/seo";
import { PageIntro } from "@/components/page-intro";
import { RelatedLinks } from "@/components/related-links";
import { FAQ } from "@/lib/faq";

export const metadata: Metadata = pageMetadata({
  title: "FAQ",
  description:
    "Answers about Epic Elites: the roster, Free Fire match formats, results, tournament invitations, partnerships and how to contact the team.",
  path: "/faq",
});

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <main id="main" className="pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <PageIntro title="FAQ" summary="Quick answers about the team, matches, the kit and getting in touch." />

      <section aria-label="Frequently asked questions" className="mx-auto mt-16 max-w-[1400px] px-4 sm:px-8">
        <div className="max-w-[60rem] border-t border-line">
          {FAQ.map((item) => (
            <details key={item.question} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left text-xl font-semibold transition-colors hover:text-violet sm:text-2xl [&::-webkit-details-marker]:hidden">
                {item.question}
                <PlusIcon
                  size={22}
                  aria-hidden
                  className="shrink-0 text-violet transition-transform duration-500 ease-[var(--ease-out-expo)] group-open:rotate-45"
                />
              </summary>
              <div className="pb-7">
                <p className="max-w-[62ch] text-lg text-smoke">{item.answer}</p>
                {item.link && (
                  <Link href={item.link.href} className="link-underline group/link mt-4 inline-flex items-center gap-2 pb-1 font-semibold text-violet">
                    {item.link.label}
                    <ArrowRightIcon size={16} aria-hidden className="transition-transform duration-500 group-hover/link:translate-x-1" />
                  </Link>
                )}
              </div>
            </details>
          ))}
        </div>
        <p className="mt-10 text-lg text-smoke">
          Didn&apos;t find your answer?{" "}
          <Link href="/contact" className="link-underline pb-0.5 text-bone hover:text-violet">
            Ask the team directly
          </Link>
          .
        </p>
      </section>

      <RelatedLinks pages={["contact", "matches", "roster"]} />
    </main>
  );
}
