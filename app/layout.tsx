import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import { MotionProvider } from "@/components/motion-provider";
import { getSettings } from "@/lib/data/public";
import { siteUrl } from "@/lib/supabase/env";
import "./globals.css";

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
    icons: { icon: settings.faviconUrl },
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
