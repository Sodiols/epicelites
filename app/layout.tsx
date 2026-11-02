import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import { MotionProvider } from "@/components/motion-provider";
import { getSettings } from "@/lib/data/public";
import { getSiteOrigin, SITE_NAME } from "@/lib/site-identity";
import "./globals.css";

/** The crest WebP the database ships with; when unchanged, the generated square icons are used. */
const DEFAULT_FAVICON = "/images/epic-elites-mark.webp";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const origin = getSiteOrigin(settings.siteUrl);
  const title = `${SITE_NAME} | ${settings.game} Esports Team`;
  const description = settings.description ??
    `Official home of ${SITE_NAME}, a ${settings.game} esports team. Meet the roster, explore the kit and follow official match updates.`;
  return {
    metadataBase: new URL(origin),
    applicationName: SITE_NAME,
    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    // Square icons generated from the crest (scripts/generate-icons.mjs). A favicon uploaded
    // in Website Settings replaces the tab icon; the home-screen icon stays the generated one.
    icons:
      settings.faviconUrl === DEFAULT_FAVICON
        ? {
            icon: [
              { url: "/favicon.ico", type: "image/x-icon", sizes: "16x16 32x32 48x48" },
              { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
              { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
            ],
            apple: "/apple-touch-icon.png",
          }
        : { icon: settings.faviconUrl, apple: "/apple-touch-icon.png" },
    manifest: "/manifest.webmanifest",
    // Google Search Console ownership check.
    verification: { google: "iEQ4_JCjqMIA2XScyuNewP0E9x8IZbxG1sdlqgcoWXY" },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      title,
      description,
      images: [settings.ogImageUrl],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const viewport: Viewport = {
  themeColor: "#0b0a0f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${geistMono.variable}`}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
