import sharp from "sharp";
import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

// Shield icon SVG — modern security shield with "S" letterform
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="innerGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#065f46"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Shield shape -->
  <path d="M64 8 L112 28 C112 28 116 72 96 96 C80 114 64 120 64 120 C64 120 48 114 32 96 C12 72 16 28 16 28 Z"
        fill="url(#shieldGrad)" filter="url(#shadow)"/>

  <!-- Inner shield -->
  <path d="M64 18 L104 34 C104 34 107 72 90 92 C77 107 64 112 64 112 C64 112 51 107 38 92 C21 72 24 34 24 34 Z"
        fill="url(#innerGrad)" opacity="0.5"/>

  <!-- Checkmark / eye symbol — represents monitoring -->
  <circle cx="64" cy="62" r="22" fill="none" stroke="#d1fae5" stroke-width="3.5" opacity="0.9"/>
  <circle cx="64" cy="62" r="10" fill="#d1fae5" opacity="0.95"/>
  <circle cx="64" cy="62" r="4" fill="#065f46"/>

  <!-- Small shield accent lines -->
  <path d="M64 90 L64 102" stroke="#6ee7b7" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
  <path d="M56 94 L64 102 L72 94" fill="none" stroke="#6ee7b7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
</svg>`;

const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(resolve(outDir, `icon-${size}.png`));

  console.log(`Generated icon-${size}.png`);
}

console.log("All icons generated.");
