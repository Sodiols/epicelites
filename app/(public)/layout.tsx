import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BrandProvider } from "@/components/brand-provider";
import { GoogleAnalytics } from "@/components/google-analytics";
import { getSettings } from "@/lib/data/public";

// Public pages are regenerated at most every minute (PUBLIC_REVALIDATE_SECONDS), and
// immediately after any admin edit.
export const revalidate = 60;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <BrandProvider logoUrl={settings.logoUrl} teamName={settings.teamName}>
      <a
        href="#main"
        className="fixed top-3 left-3 z-[100] -translate-y-[200%] bg-violet px-4 py-3 text-sm font-semibold text-night focus:translate-y-0"
      >
        Skip to content
      </a>
      <SiteHeader />
      {children}
      <SiteFooter />
      <GoogleAnalytics />
    </BrandProvider>
  );
}
