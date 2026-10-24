import { OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "Epic Elites, Free Fire esports team";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ title: "Epic Elites", subtitle: "Free Fire esports team. Roster, fixtures, results and the black and violet kit." });
}
