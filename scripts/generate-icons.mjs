/**
 * Rasterizes the app logo mark into every PNG icon the PWA needs.
 *
 *   node scripts/generate-icons.mjs
 *
 * Requires `sharp` (devDependency). Source of truth: scripts/assets/logo-mark.svg
 * (black on transparent). Favicon SVG lives at app/icon.svg and is not touched here.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const markPath = join(root, "scripts/assets/logo-mark.svg");
const outDir = join(root, "public/icons");

// Logo intrinsic box is 145x172 — portrait. We letterbox it into a square.
const MARK_W = 145;
const MARK_H = 172;

/** Render the mark centered on a square canvas, scaled to `inset` of the shorter edge. */
async function render({ size, background, inset, fill }) {
  const markSvg = (await readFile(markPath, "utf8")).replace(
    'fill="#000000"',
    `fill="${fill}"`,
  );
  const target = Math.round(size * inset);
  const scale = Math.min(target / MARK_W, target / MARK_H);
  const w = Math.round(MARK_W * scale);
  const h = Math.round(MARK_H * scale);

  const mark = await sharp(Buffer.from(markSvg))
    .resize(w, h, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: mark, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) }])
    .png()
    .toBuffer();
}

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

const jobs = [
  // Standard app icons — black mark, white ground, comfortable margin.
  { file: "icon-192.png", size: 192, background: WHITE, inset: 0.62, fill: "#000000" },
  { file: "icon-512.png", size: 512, background: WHITE, inset: 0.62, fill: "#000000" },
  // Maskable — safe zone is the inner 80%, so keep the mark small (Android crops a circle).
  { file: "icon-maskable-512.png", size: 512, background: WHITE, inset: 0.5, fill: "#000000" },
  // iOS home screen — no transparency, no rounding (iOS masks it).
  { file: "apple-touch-icon.png", size: 180, background: WHITE, inset: 0.6, fill: "#000000" },
];

for (const { file, ...opts } of jobs) {
  const png = await render(opts);
  await writeFile(join(outDir, file), png);
  console.log(`✓ ${file} (${opts.size}px)`);
}
