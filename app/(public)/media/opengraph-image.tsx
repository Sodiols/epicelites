import { OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "Epic Elites media and kit";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ title: "Media & Kit", subtitle: "The jersey in 3D, team photos and videos." });
}
