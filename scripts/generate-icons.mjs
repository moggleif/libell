// Renders the PWA icon set from the single SVG source, so the repository stays
// text-only (see docs/01-CONTRIBUTING.md). Run via `npm run icons`; `npm run
// build` does it automatically.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'public/icons/icon.svg');
const outDir = resolve(root, 'public/icons');

// A maskable icon is cropped to a safe zone of ~80%, so the artwork is padded
// to survive the crop on launchers that apply their own mask shape.
const targets = [
  { file: 'icon-192.png', size: 192, padding: 0 },
  { file: 'icon-512.png', size: 512, padding: 0 },
  { file: 'icon-maskable-512.png', size: 512, padding: 0.1 },
];

const svg = await readFile(source);
await mkdir(outDir, { recursive: true });

for (const { file, size, padding } of targets) {
  const inner = Math.round(size * (1 - 2 * padding));
  const offset = Math.round((size - inner) / 2);
  const rendered = await sharp(svg, { density: 384 }).resize(inner, inner).png().toBuffer();
  const canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: '#101418',
    },
  });
  const out = await canvas
    .composite([{ input: rendered, top: offset, left: offset }])
    .png()
    .toBuffer();
  await writeFile(resolve(outDir, file), out);
  console.log(`icons: wrote ${file} (${size}x${size})`);
}
