// Builds square site icons from the vector crest (public/images/epic-elites-mark.svg).
// The crest is wider than tall, so it is scaled to fill the square's width and centred
// vertically: the largest it can be without cropping. Browsers otherwise squeeze the old
// 291x205 image into the square tab slot, which makes it look small and blurry.
//
// Outputs (in public/):
//   icon.svg              any size, sharp in modern browsers
//   favicon.ico           16, 32 and 48 px, for older browsers and /favicon.ico requests
//   apple-touch-icon.png  180 px on the site's dark background (iOS home screen)
//   icon-192.png, icon-512.png  Android / install icons on the dark background
//
// Usage: node scripts/generate-icons.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = (f) => join(root, "public", f);
const crestSvg = readFileSync(pub("images/epic-elites-mark.svg"), "utf8");

const [, , vbW, vbH] = /viewBox="([\d.\s]+)"/.exec(crestSvg)[1].split(/\s+/).map(Number);
const inner = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(crestSvg)[1];
const NIGHT = "#0b0a0f";

/** Square SVG with the crest at `fill` of the width, optionally on a background. */
function squareSvg({ fill, background }) {
  const side = vbW / fill;
  const x = (side - vbW) / 2;
  const y = (side - vbH) / 2;
  const bg = background ? `<rect width="${side}" height="${side}" fill="${background}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}">${bg}<g transform="translate(${x} ${y})">${inner}</g></svg>\n`;
}

/** Rasterise at twice the target size, then downscale, for clean small-size edges. */
const png = (svg, size) => {
  const sized = svg.replace("<svg ", `<svg width="${size * 2}" height="${size * 2}" `);
  return sharp(Buffer.from(sized))
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
};

// Tab icons: crest edge to edge (tiny sizes need every pixel), transparent background.
const tabSvg = squareSvg({ fill: 1 });
writeFileSync(pub("icon.svg"), tabSvg);

// ICO container holding PNG images (supported by every browser that reads .ico).
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((s) => png(tabSvg, s)));
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((img, i) => {
  const e = 6 + i * 16;
  header.writeUInt8(sizes[i], e);
  header.writeUInt8(sizes[i], e + 1);
  header.writeUInt8(0, e + 2);
  header.writeUInt8(0, e + 3);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(img.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += img.length;
});
writeFileSync(pub("favicon.ico"), Buffer.concat([header, ...images]));

// Home-screen and install icons: platforms add their own rounded mask, so keep a margin
// and the dark background (iOS would otherwise fill transparency with black).
const tileSvg = squareSvg({ fill: 0.72, background: NIGHT });
writeFileSync(pub("apple-touch-icon.png"), await png(tileSvg, 180));
writeFileSync(pub("icon-192.png"), await png(tileSvg, 192));
writeFileSync(pub("icon-512.png"), await png(tileSvg, 512));

console.log("Wrote public/icon.svg, favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png");
