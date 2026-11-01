#!/usr/bin/env node
/**
 * Render the app icons from the Lull mascot artwork.
 *
 *   node scripts/generate-icons.mjs
 *
 * Writes public/icons/*.png, app/icon.png and app/apple-icon.png. The art sits inside the
 * central 80% of the canvas so the same files work as maskable icons.
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="58%" r="80%">
      <stop offset="0%" stop-color="#5a46b8"/>
      <stop offset="55%" stop-color="#2a2070"/>
      <stop offset="100%" stop-color="#120f33"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="55%" r="50%">
      <stop offset="0%" stop-color="#ffd98a" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#ffd98a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="face" cx="38%" cy="32%" r="75%">
      <stop offset="0%" stop-color="#fff6dc"/>
      <stop offset="70%" stop-color="#ffe3a1"/>
      <stop offset="100%" stop-color="#f6c470"/>
    </radialGradient>
    <linearGradient id="cap" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8f80ff"/>
      <stop offset="100%" stop-color="#4b3bb0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g fill="#fff">
    <circle cx="70" cy="86" r="2.6" opacity=".8"/><circle cx="150" cy="44" r="2" opacity=".6"/>
    <circle cx="430" cy="74" r="3" opacity=".8"/><circle cx="470" cy="170" r="2" opacity=".6"/>
    <circle cx="44" cy="250" r="2" opacity=".5"/><circle cx="96" cy="430" r="2.4" opacity=".6"/>
    <circle cx="448" cy="420" r="2.6" opacity=".7"/><circle cx="330" cy="40" r="1.8" opacity=".6"/>
  </g>
  <g transform="translate(56 40) scale(1.8)">
    <g fill="none" stroke="#a99bff" stroke-width="1.6">
      <circle cx="100" cy="112" r="70" opacity=".5"/>
      <circle cx="100" cy="112" r="84" opacity=".3"/>
      <circle cx="100" cy="112" r="98" opacity=".16"/>
    </g>
    <circle cx="100" cy="112" r="80" fill="url(#glow)"/>
    <circle cx="100" cy="112" r="56" fill="url(#face)"/>
    <g fill="#f0b95f" opacity=".45"><circle cx="128" cy="136" r="7"/><circle cx="76" cy="144" r="4.5"/><circle cx="136" cy="104" r="3.5"/></g>
    <path d="M50 92 C58 52 98 30 140 38 C168 44 176 62 168 70 C150 62 126 66 112 80 C96 96 70 100 50 92 Z" fill="url(#cap)"/>
    <path d="M46 90 C70 104 102 100 118 84 C130 72 150 66 170 72" fill="none" stroke="#efe9ff" stroke-width="9" stroke-linecap="round"/>
    <circle cx="172" cy="66" r="9" fill="#ffd98a"/>
    <g fill="#ff9aa8" opacity=".5"><ellipse cx="76" cy="124" rx="8" ry="5"/><ellipse cx="124" cy="124" rx="8" ry="5"/></g>
    <g fill="none" stroke="#4a3a2a" stroke-width="3.4" stroke-linecap="round">
      <path d="M73 112 Q82 121 91 112"/><path d="M109 112 Q118 121 127 112"/><path d="M92 131 Q100 137 108 131"/>
    </g>
  </g>
</svg>`;

const out = [
    ['public/icons/icon-192.png', 192],
    ['public/icons/icon-192x192.png', 192],
    ['public/icons/icon-384.png', 384],
    ['public/icons/icon-384x384.png', 384],
    ['public/icons/icon-512.png', 512],
    ['public/icons/icon-512x512.png', 512],
    ['app/icon.png', 512],
    ['app/apple-icon.png', 180],
];

mkdirSync(join(ROOT, 'public', 'icons'), { recursive: true });
for (const [file, size] of out) {
    await sharp(Buffer.from(svg), { density: 300 })
        .resize(size, size)
        .png()
        .toFile(join(ROOT, file));
    console.log('wrote', file);
}
