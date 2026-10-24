// Separates the supplied kit render (front and back jerseys, overlapping at the front jersey's
// right sleeve) into a clean front image and a clean back image, then rebuilds the full kit
// image with the two jerseys side by side. Only the original pixels are used: the outline of
// the front sleeve was traced from the source, and the area each cut uncovers is filled with
// a studio backdrop matched to the source's own background.
//
// Usage: node scripts/split-kit.mjs "<path to the 1422x1106 kit PNG>"

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = process.argv[2];
if (!SRC) throw new Error("Pass the path to the original kit PNG.");

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const at = (x, y) => (y * W + x) * 3;
const smooth = (e0, e1, v) => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// Outer edge of the front jersey (its right sleeve and body), traced from the source:
// [y, x] points; everything left of this line belongs to the front jersey or its background.
const FRONT_EDGE = [
  [0, 760], [150, 762], [210, 772], [260, 785], [320, 792], [400, 797], [450, 801],
  [470, 808], [505, 811], [512, 806], [518, 700], [522, 655], [H, 655],
];
const edgeAt = (y) => {
  for (let i = 1; i < FRONT_EDGE.length; i++) {
    const [y0, x0] = FRONT_EDGE[i - 1];
    const [y1, x1] = FRONT_EDGE[i];
    if (y <= y1) return x0 + ((x1 - x0) * (y - y0)) / Math.max(1, y1 - y0);
  }
  return FRONT_EDGE.at(-1)[1];
};
// Where the cut runs along fabric it stays sharp; through empty background it blends widely.
// The width eases between the two over a few rows so the backdrop never shows a step.
const featherAt = (y) => {
  const sharpness = smooth(110, 175, y) * (1 - smooth(505, 540, y));
  return 36 + (2.5 - 36) * sharpness;
};

// Studio backdrop: a soft pool of light behind the jersey, falling off to near black,
// sampled from the source (centre #221d27, edges #08080a) plus fine grain to match the render.
const CENTER = [0x22, 0x1d, 0x27];
const EDGE = [0x08, 0x08, 0x0a];
function backdrop(x, y, cx, cy, rx, ry) {
  const d = Math.min(1, Math.hypot((x - cx) / rx, (y - cy) / ry));
  const t = 1 - d * d * (3 - 2 * d); // smoothstep falloff
  const n = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1; // deterministic grain
  return CENTER.map((c, k) => EDGE[k] + (c - EDGE[k]) * t + n * 2);
}

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

/**
 * Renders one jersey onto its own canvas.
 * keep(x, y) -> 0..1 says how much of the source pixel to keep (1 = jersey, 0 = backdrop).
 */
function render({ srcLeft, srcRight, outW, offsetX, keep, light }) {
  const out = Buffer.alloc(outW * H * 3);
  for (let y = 0; y < H; y++) {
    for (let ox = 0; ox < outW; ox++) {
      const sx = ox - offsetX + srcLeft;
      const bg = backdrop(ox, y, light.cx, light.cy, light.rx, light.ry);
      let a = 0;
      let px = bg;
      if (sx >= srcLeft && sx < srcRight) {
        // Every edge of the source region fades into the new backdrop, so no hard line shows
        // where the original render ended (the back jersey's right cuff touches its edge).
        const fadeL = srcLeft === 0 ? smooth(0, 14, sx) : smooth(srcLeft, srcLeft + 40, sx);
        const fadeR = srcRight === W ? smooth(W, W - 34, sx) : smooth(srcRight, srcRight - 40, sx);
        a = keep(sx, y) * fadeL * fadeR;
        const i = at(sx, y);
        px = [data[i], data[i + 1], data[i + 2]];
      }
      const o = (y * outW + ox) * 3;
      for (let k = 0; k < 3; k++) out[o + k] = clamp(px[k] * a + bg[k] * (1 - a));
    }
  }
  return sharp(out, { raw: { width: outW, height: H, channels: 3 } });
}

// Front: keep everything left of the traced edge; the back jersey becomes backdrop.
const frontKeep = (x, y) => 1 - smooth(edgeAt(y) - featherAt(y), edgeAt(y) + featherAt(y), x);
// Back: keep everything right of the edge, with a longer shadowed falloff on the sleeve that
// was hidden behind the front jersey (nothing is invented where the source has no fabric).
const backKeep = (x, y) => smooth(edgeAt(y) + 6, edgeAt(y) + (y > 150 && y < 515 ? 70 : 60), x);

const OUT_W = 1000;
const front = render({
  srcLeft: 0,
  srcRight: 880,
  outW: OUT_W,
  offsetX: 92, // centres the front jersey (spans ~x 5..812) on the canvas
  keep: frontKeep,
  light: { cx: OUT_W / 2, cy: 430, rx: 620, ry: 820 },
});
const back = render({
  srcLeft: 760,
  srcRight: W,
  outW: OUT_W,
  offsetX: 150, // back jersey spans ~x 775..1420; centred with room for the shadowed sleeve
  keep: backKeep,
  light: { cx: OUT_W / 2, cy: 430, rx: 620, ry: 820 },
});

const img = (f) => join(root, "public/images", f);
// New file names (-v2) so image caches (Next.js, Vercel, browsers) never serve the old cut-up
// versions; the original names are overwritten too, for any reference still using them.
for (const name of ["jersey-front-v2.webp", "jersey-front.webp"])
  await front.clone().webp({ quality: 92, smartSubsample: true }).toFile(img(name));
for (const name of ["jersey-back-v2.webp", "jersey-back.webp"])
  await back.clone().webp({ quality: 92, smartSubsample: true }).toFile(img(name));

// Full kit: both jerseys side by side on one continuous backdrop.
const KIT_W = 1900;
const frontBuf = await front.clone().png().toBuffer();
const backBuf = await back.clone().png().toBuffer();
const base = Buffer.alloc(KIT_W * H * 3);
for (let y = 0; y < H; y++)
  for (let x = 0; x < KIT_W; x++) {
    const px = backdrop(x, y, KIT_W / 2, 430, 1250, 900);
    const o = (y * KIT_W + x) * 3;
    for (let k = 0; k < 3; k++) base[o + k] = clamp(px[k]);
  }
// Each jersey's canvas edges are faded so the two backdrops merge into the shared one.
const fadeMask = await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${OUT_W}" height="${H}"><defs><linearGradient id="g"><stop offset="0" stop-color="#000"/><stop offset="0.14" stop-color="#fff"/><stop offset="0.86" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  ),
)
  .png()
  .toBuffer();
const withFade = (buf) => sharp(buf).ensureAlpha().composite([{ input: fadeMask, blend: "dest-in" }]).png().toBuffer();
const kit = sharp(base, { raw: { width: KIT_W, height: H, channels: 3 } }).composite([
  { input: await withFade(frontBuf), left: 0, top: 0 },
  { input: await withFade(backBuf), left: KIT_W - OUT_W, top: 0 },
]);
const kitBuf = await kit.png().toBuffer();
for (const name of ["team-kit-v2.webp", "team-kit.webp"])
  await sharp(kitBuf).webp({ quality: 90, smartSubsample: true }).toFile(img(name));

console.log(`Wrote jersey-front-v2.webp and jersey-back-v2.webp (${OUT_W}x${H}) and team-kit-v2.webp (${KIT_W}x${H})`);
