// Traces the supplied Epic Elites crest (public/images/epic-elites-mark.webp, 291x205) into a
// resolution-independent SVG with potrace, so it stays sharp at hero size. The shape comes
// from the original artwork's alpha channel; nothing is redrawn by hand.
// Usage: node scripts/vectorize-logo.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";
import potrace from "potrace";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "public/images/epic-elites-mark.webp");
const out = join(root, "public/images/epic-elites-mark.svg");
const SCALE = 8;
const COLOR = "#9b74ef"; // average of the crest's opaque pixels

const meta = await sharp(src).metadata();
const width = meta.width * SCALE;
const height = meta.height * SCALE;

// Upscale, then blur the alpha so the source's pixel steps become smooth slopes; the tracer
// thresholds at the middle of each slope, which lands on the true edge.
const alpha = await sharp(src)
  .ensureAlpha()
  .extractChannel("alpha")
  .resize(width, height, { kernel: "cubic" })
  .blur(SCALE * 1.6)
  .raw()
  .toBuffer({ resolveWithObject: true });
const mask = await sharp(alpha.data, { raw: { width, height, channels: 1 } }).negate().png().toBuffer();

const path = await new Promise((resolve, reject) =>
  potrace.trace(mask, { threshold: 128, turdSize: 200, optCurve: true, optTolerance: 2, alphaMax: 1.0, color: COLOR }, (err, svg) =>
    err ? reject(err) : resolve(svg),
  ),
);

// Keep only the path, with a tight viewBox in the original's proportions.
const d = /<path[^>]*\sd="([^"]+)"/.exec(path)?.[1];
if (!d) throw new Error("Tracing produced no path");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Epic Elites"><path fill="${COLOR}" fill-rule="evenodd" d="${d}"/></svg>\n`;
writeFileSync(out, svg);
console.log(`Wrote ${out} (${(svg.length / 1024).toFixed(1)} KB, viewBox ${width}x${height})`);
