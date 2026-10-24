import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import { PageIntro } from "@/components/page-intro";
import { ContactForm } from "@/components/contact-form";
import { getSettings } from "@/lib/data/public";
import { RelatedLinks } from "@/components/related-links";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Contact Epic Elites about partnerships, tournament invitations, media requests or anything else. Messages go straight to the team.",
  path: "/contact",
});

export default async function ContactPage() {
  const settings = await getSettings();
  const email = settings.contactEmail;

  return (
    <main id="main" className="pb-24">
      <PageIntro
        title="Contact"
        summary="Partnerships, tournament invitations and media requests. Tell the team what you need and who you are."
      />

      <div className="mx-auto mt-16 grid max-w-[1400px] gap-12 px-4 sm:px-8 lg:grid-cols-12">
        <aside className="space-y-10 lg:col-span-4">
          <div>
            <h2 className="text-sm font-semibold text-smoke">Email</h2>
            {email ? (
              <a href={`mailto:${email}`} className="link-underline mt-2 inline-block text-xl font-semibold break-all hover:text-violet">
                {email}
              </a>
            ) : (
              <p className="mt-2 text-lg">Use the form; it goes straight to the team inbox.</p>
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-smoke">Social</h2>
            {settings.socials.length > 0 ? (
              <ul className="mt-3 grid gap-2">
                {settings.socials.map(({ network, url }) => (
                  <li key={network}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-underline inline-flex items-center gap-2 text-lg capitalize hover:text-violet"
                    >
                      {network}
                      <ArrowUpRightIcon size={16} aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-lg">Official channels are listed here once they go live.</p>
            )}
          </div>
          {settings.location && (
            <div>
              <h2 className="text-sm font-semibold text-smoke">Based in</h2>
              <p className="mt-2 text-lg">{settings.location}</p>
            </div>
          )}
        </aside>
        <div className="lg:col-span-8">
          <ContactForm email={email} />
        </div>
      </div>
      <RelatedLinks pages={["faq", "about", "news"]} />
    </main>
  );
}
