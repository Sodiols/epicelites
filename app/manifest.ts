import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site-identity";

/** Install/home-screen details for Android and desktop browsers. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: "Official site of Epic Elites, a Free Fire esports team.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0a0f",
    theme_color: "#0b0a0f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
