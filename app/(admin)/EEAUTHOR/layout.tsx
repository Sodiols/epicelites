import type { Metadata } from "next";

// Admin pages are personal and must never be cached or prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Epic Elites Admin" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "same-origin",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100dvh] bg-night">{children}</div>;
}
