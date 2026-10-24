import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import { MotionProvider } from "@/components/motion-provider";
import { getSettings } from "@/lib/data/public";
import { siteUrl } from "@/lib/supabase/env";
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
  const origin = settings.siteUrl ?? siteUrl;
  return {
    metadataBase: new URL(origin),
    title: {
      default: `${settings.teamName} | ${settings.game} Esports Team`,
      template: `%s | ${settings.teamName}`,
    },
    description:
      settings.description ??
      `Official home of ${settings.teamName}, a ${settings.game} esports team. Meet the roster, explore the kit and follow official match updates.`,
    // Square icons generated from the crest (scripts/generate-icons.mjs). A favicon uploaded
    // in Website Settings replaces the tab icon; the home-screen icon stays the generated one.
    icons:
      settings.faviconUrl === DEFAULT_FAVICON
        ? {
            icon: [
              { url: "/favicon.ico", sizes: "48x48" },
              { url: "/icon.svg", type: "image/svg+xml" },
            ],
            apple: "/apple-touch-icon.png",
          }
        : { icon: settings.faviconUrl, apple: "/apple-touch-icon.png" },
    manifest: "/manifest.webmanifest",
    // Google Search Console ownership check.
    verification: { google: "iEQ4_JCjqMIA2XScyuNewP0E9x8IZbxG1sdlqgcoWXY" },
    openGraph: {
      type: "website",
      siteName: settings.teamName,
      images: [settings.ogImageUrl],
    },
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
