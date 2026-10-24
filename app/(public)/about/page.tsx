import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { PageIntro } from "@/components/page-intro";
import { PrinciplesStack } from "@/components/principles-stack";
import { ClipReveal } from "@/components/ui/clip-reveal";
import { SplitReveal } from "@/components/ui/split-reveal";
import { getPartners, getSettings } from "@/lib/data/public";
import { PARTNER_TYPES } from "@/lib/labels";
import { RelatedLinks } from "@/components/related-links";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "Who Epic Elites are: a Free Fire esports team, the principles we play by and the identity behind Rise Above.",
  path: "/about",
});

export default async function AboutPage() {
  const [settings, partners] = await Promise.all([getSettings(), getPartners()]);

  return (
    <main id="main" className="pb-24">
      <PageIntro
        title="About"
        summary="A Free Fire team united by competition and a shared identity, and the home for everything that shapes it."
      />

      <section aria-labelledby="who-title" className="mx-auto mt-24 grid max-w-[1400px] gap-10 px-4 sm:px-8 md:grid-cols-12">
        <SplitReveal
          id="who-title"
          lines={["One team.", "One name."]}
          lineClassName={["", "text-violet"]}
          className="font-display text-[clamp(3.25rem,7vw,6.5rem)] leading-[0.86] md:col-span-6"
        />
        <div className="space-y-5 text-lg text-smoke md:col-span-5 md:col-start-8 md:pt-3">
          <p className="text-2xl leading-snug text-bone">
            {settings.aboutLead}
          </p>
          {settings.aboutBody.split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <Link href="/roster" className="link-underline group inline-flex items-center gap-2 pb-1 font-semibold text-violet">
            Meet the roster
            <ArrowRightIcon size={16} aria-hidden className="transition-transform duration-500 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <section aria-labelledby="principles-title" className="mx-auto mt-32 max-w-[1100px] px-4 sm:px-8">
        <h2 id="principles-title" className="font-display text-[clamp(2.75rem,6vw,5rem)] leading-[0.86]">
          What we play by
        </h2>
        <div className="mt-6">
          <PrinciplesStack />
        </div>
      </section>

      <section aria-labelledby="identity-title" className="mx-auto mt-24 grid max-w-[1400px] items-center gap-10 px-4 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Image src={settings.logoUrl} alt={`${settings.teamName} crest`} width={72} height={51} className="h-[51px] w-[72px] object-contain" />
          <h2 id="identity-title" className="font-display mt-6 text-[clamp(3rem,6vw,5.5rem)] leading-[0.86]">
            Black. Violet. <span className="text-violet">Rise above.</span>
          </h2>
          <p className="mt-5 max-w-[40ch] text-lg text-smoke">
            The words printed down the side of the jersey are the mindset behind the name.
          </p>
          <Link href="/media" className="btn btn-primary group mt-8">
            See the kit
            <ArrowRightIcon
              size={16}
              weight="bold"
              aria-hidden
              className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
            />
          </Link>
        </div>
        <div className="chamfer relative aspect-[1900/1106] [--cut:32px] lg:col-span-7">
          <ClipReveal className="absolute inset-0">
            <Image src={settings.kitImageUrl} alt="Epic Elites jersey artwork, front and back" fill sizes="(min-width: 1024px) 55vw, 92vw" className="object-cover" />
          </ClipReveal>
        </div>
      </section>
      {partners.length > 0 && (
        <section aria-labelledby="partners-title" className="mx-auto mt-32 max-w-[1400px] px-4 sm:px-8">
          <h2 id="partners-title" className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.88]">
            Partners
          </h2>
          <ul className="mt-10 grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-4">
            {partners.map((partner) => {
              const content = partner.logo_url ? (
                <Image
                  src={partner.logo_url}
                  alt={partner.name}
                  width={240}
                  height={120}
                  className="h-16 w-auto max-w-[80%] object-contain opacity-80 transition-opacity group-hover:opacity-100"
                />
              ) : (
                <span className="text-xl font-semibold">{partner.name}</span>
              );
              return (
                <li key={partner.id} className="bg-night">
                  {partner.website_url ? (
                    <a
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${partner.name}, ${PARTNER_TYPES[partner.partner_type]}`}
                      className="group grid h-40 place-items-center p-6"
                    >
                      {content}
                    </a>
                  ) : (
                    <div className="group grid h-40 place-items-center p-6" title={partner.name}>
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <RelatedLinks pages={["roster", "matches", "faq"]} />
    </main>
  );
}
