import { OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "Epic Elites news";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ title: "News", subtitle: "Official announcements from the team." });
}
