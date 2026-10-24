import { OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "Epic Elites roster";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ title: "Roster", subtitle: "Every player, role and jersey number in the Epic Elites lineup." });
}
