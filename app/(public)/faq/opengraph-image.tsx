import { OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "Epic Elites frequently asked questions";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ title: "FAQ", subtitle: "Answers about the team, matches, the kit and getting in touch." });
}
