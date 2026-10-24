import { OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "About Epic Elites";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ title: "About", subtitle: "The team, the principles we play by and Rise Above." });
}
