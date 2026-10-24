import { OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "Contact Epic Elites";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ title: "Contact", subtitle: "Partnerships, tournament invitations and media requests." });
}
