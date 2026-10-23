import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import { nav } from "@/lib/team";
import { getSettings } from "@/lib/data/public";
import { BackToTop } from "@/components/back-to-top";
import { FooterWordmark } from "@/components/footer-wordmark";

export async function SiteFooter() {
  const settings = await getSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line bg-carbon">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 pt-16 pb-10 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-5">
          <Image src={settings.logoUrl} alt="" width={56} height={40} className="h-10 w-14 object-contain" />
          <p className="mt-6 max-w-[34ch] text-smoke">{settings.footerDescription}</p>
          {settings.location && <p className="mt-3 text-sm text-smoke">{settings.location}</p>}
        </div>

        <nav aria-label="Footer" className="md:col-span-3">
          <h2 className="font-wide text-[0.6875rem] text-smoke">Explore</h2>
          <ul className="mt-5 grid gap-2.5">
            {[...nav, { href: "/contact", label: "Contact" }].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="link-underline text-bone hover:text-violet">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-4">
          <h2 className="font-wide text-[0.6875rem] text-smoke">Follow</h2>
          {settings.socials.length > 0 ? (
            <ul className="mt-5 grid gap-2.5">
              {settings.socials.map(({ network, url }) => (
                <li key={network}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline inline-flex items-center gap-2 capitalize hover:text-violet"
                  >
                    {network}
                    <ArrowUpRightIcon size={14} aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 max-w-[32ch] text-smoke">
              Official social channels will be listed here once they go live.
            </p>
          )}
        </div>
      </div>

      <FooterWordmark text={settings.teamName} />

      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 border-t border-line px-4 py-6 font-mono text-xs text-smoke sm:px-8">
        <span>
          © {year} {settings.teamName}. All rights reserved.
        </span>
        <BackToTop />
      </div>
    </footer>
  );
}
