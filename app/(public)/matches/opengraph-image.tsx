import { OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "Epic Elites matches and results";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ title: "Matches & Results", subtitle: "Upcoming fixtures and verified results." });
}
