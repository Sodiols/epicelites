import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** Standard social card size (Facebook, X, LinkedIn, Discord, WhatsApp). */
export const OG_SIZE = { width: 1200, height: 630 };

let assets: Promise<{ font: Buffer; crest: string }> | null = null;
function loadAssets() {
  assets ??= Promise.all([
    readFile(join(process.cwd(), "assets/fonts/ArchivoNarrow-Bold.ttf")),
    readFile(join(process.cwd(), "public/images/epic-elites-mark.svg"), "utf8"),
  ]).then(([font, svg]) => ({ font, crest: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}` }));
  return assets;
}

/**
 * Branded share preview: page name in the condensed display face, a one-line description,
 * and the crest inside the safe-zone ring from the homepage hero. Rendered at build time.
 */
export async function renderOgImage({ title, subtitle }: { title: string; subtitle: string }) {
  const { font, crest } = await loadAssets();
  const long = title.length > 22;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0b0a0f",
          color: "#eeecf3",
          fontFamily: "Archivo Narrow",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* The storm outside the zone, then the zone itself. */}
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "#1e1440", opacity: 0.85 }} />
        <div
          style={{
            position: "absolute",
            right: -90,
            top: -25,
            width: 680,
            height: 680,
            borderRadius: 9999,
            background: "radial-gradient(circle, #241d36 0%, #0b0a0f 70%)",
            border: "4px solid #8e6bff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={crest} width={360} height={254} alt="" style={{ marginRight: 60 }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: 720, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, letterSpacing: 4, color: "#8e6bff" }}>
            <div style={{ width: 48, height: 3, background: "#8e6bff" }} />
            EPIC ELITES
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: long ? 92 : 132, lineHeight: 0.9, textTransform: "uppercase", letterSpacing: -1 }}>{title}</div>
            <div style={{ marginTop: 28, fontSize: 32, lineHeight: 1.3, color: "#b9b5c6", maxWidth: 500 }}>{subtitle}</div>
          </div>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 3, color: "#9b97a8" }}>FREE FIRE ESPORTS</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: "Archivo Narrow", data: font, weight: 700, style: "normal" }] },
  );
}
