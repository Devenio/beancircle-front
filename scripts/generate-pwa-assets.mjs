/**
 * Generates every PWA raster asset (icons, maskable icons, apple-touch icon,
 * favicons, shortcut icons and store screenshots) from brand-accurate master
 * SVGs. Run it whenever the brand mark or icon sizes change:
 *
 *   nvm use 24 && node scripts/generate-pwa-assets.mjs
 *
 * Output is committed under public/icons and public/screenshots so the assets
 * are served statically with zero runtime cost (best for Lighthouse + offline).
 *
 * `sharp` is a transitive dependency (pulled in by Next.js) so it is not
 * symlinked at the top level under pnpm — resolve it from the .pnpm store.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const require = createRequire(import.meta.url);

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    // Fall back to the hoisted pnpm location.
    const pkg = require.resolve('sharp/package.json', {
      paths: [resolve(root, 'node_modules/.pnpm/sharp@0.34.5/node_modules')],
    });
    const mod = await import(pathToFileURL(resolve(dirname(pkg), 'lib/index.js')).href);
    return mod.default ?? mod;
  }
}

const sharp = await loadSharp();

/* ── Brand tokens (mirrors src/components/auth/bean-logo.tsx) ─────────────── */
const RING = ['#f5b878', '#c87f43', '#7a4a25'];
const ESPRESSO = ['#2a1a12', '#140b07'];
const CRACK = '#160d08';

/** Reusable bean mark, drawn into a `size`×`size` canvas at the given fraction. */
function beanMark(size, fraction) {
  // The bean lives in a 96-unit space centred at (48,48) with a ~64u footprint.
  const k = (fraction * size) / 64;
  const offset = size / 2 - 48 * k;
  return `
    <g transform="translate(${offset.toFixed(2)} ${offset.toFixed(2)}) scale(${k.toFixed(4)})">
      <ellipse cx="48" cy="48" rx="20" ry="27" fill="url(#ring)" transform="rotate(32 48 48)" />
      <path d="M48 24 C40 36, 56 60, 48 72" fill="none" stroke="${CRACK}"
            stroke-width="4" stroke-linecap="round" transform="rotate(32 48 48)" />
    </g>`;
}

function defs() {
  return `
    <defs>
      <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${RING[0]}" />
        <stop offset="55%" stop-color="${RING[1]}" />
        <stop offset="100%" stop-color="${RING[2]}" />
      </linearGradient>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${ESPRESSO[0]}" />
        <stop offset="100%" stop-color="${ESPRESSO[1]}" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="42%" r="60%">
        <stop offset="0%" stop-color="#c87f43" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#c87f43" stop-opacity="0" />
      </radialGradient>
    </defs>`;
}

/** "any"-purpose icon: rounded square, brand bean, soft glow. */
function iconSvg(size = 512) {
  const r = size * 0.2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${defs()}
    <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#bg)" />
    <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#glow)" />
    <rect x="${size * 0.012}" y="${size * 0.012}" width="${size * 0.976}" height="${size * 0.976}"
          rx="${r * 0.95}" ry="${r * 0.95}" fill="none" stroke="#ffffff" stroke-opacity="0.06"
          stroke-width="${size * 0.012}" />
    ${beanMark(size, 0.46)}
  </svg>`;
}

/** Maskable icon: edge-to-edge background, bean inside the 80% safe zone. */
function maskableSvg(size = 512) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${defs()}
    <rect width="${size}" height="${size}" fill="url(#bg)" />
    <rect width="${size}" height="${size}" fill="url(#glow)" />
    ${beanMark(size, 0.34)}
  </svg>`;
}

/** Apple touch icon: opaque, full-bleed (iOS applies its own rounding/mask). */
function appleSvg(size = 180) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${defs()}
    <rect width="${size}" height="${size}" fill="url(#bg)" />
    <rect width="${size}" height="${size}" fill="url(#glow)" />
    ${beanMark(size, 0.44)}
  </svg>`;
}

/** Shortcut icon: brand background + a simple white glyph. */
function shortcutSvg(glyph, size = 96) {
  const r = size * 0.24;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
    <rect width="24" height="24" rx="${(r / size) * 24}" fill="#1a0f0a" />
    <g fill="none" stroke="#f5b878" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
       transform="translate(4 4) scale(0.667)">
      ${glyph}
    </g>
  </svg>`;
}

const GLYPHS = {
  // Lucide-style: stamp (passport) and message-circle (messages).
  passport:
    '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 2v20"/><path d="M7 2v20"/><circle cx="12" cy="11" r="3"/>',
  messages:
    '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>',
};

/* ── Screenshots (branded mockups for the richer install UI) ──────────────── */
function screenshotSvg(w, h, label) {
  const cx = w / 2;
  const portrait = h >= w;
  const logo = portrait ? Math.min(w, h) * 0.22 : Math.min(w, h) * 0.28;
  const cardW = portrait ? w * 0.82 : w * 0.42;
  const cardX = cx - cardW / 2;
  const cardTop = portrait ? h * 0.52 : h * 0.46;
  const cards = Array.from({ length: portrait ? 3 : 2 }, (_, i) => {
    const y = cardTop + i * (h * 0.12);
    return `
      <rect x="${cardX}" y="${y}" width="${cardW}" height="${h * 0.09}" rx="20" fill="#ffffff" fill-opacity="0.06" />
      <circle cx="${cardX + h * 0.05}" cy="${y + h * 0.045}" r="${h * 0.028}" fill="url(#ring)" />
      <rect x="${cardX + h * 0.09}" y="${y + h * 0.028}" width="${cardW * 0.45}" height="${h * 0.014}" rx="7" fill="#ffffff" fill-opacity="0.5" />
      <rect x="${cardX + h * 0.09}" y="${y + h * 0.052}" width="${cardW * 0.62}" height="${h * 0.012}" rx="6" fill="#ffffff" fill-opacity="0.2" />`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${defs()}
    <rect width="${w}" height="${h}" fill="url(#bg)" />
    <rect width="${w}" height="${h}" fill="url(#glow)" />
    <g transform="translate(${cx - logo / 2} ${portrait ? h * 0.16 : h * 0.18})">
      <rect width="${logo}" height="${logo}" rx="${logo * 0.24}" fill="#ffffff" fill-opacity="0.05" />
      <g transform="translate(${logo * 0.18} ${logo * 0.18}) scale(${(logo * 0.64) / 96})">
        <ellipse cx="48" cy="48" rx="20" ry="27" fill="url(#ring)" transform="rotate(32 48 48)" />
        <path d="M48 24 C40 36, 56 60, 48 72" fill="none" stroke="${CRACK}" stroke-width="4" stroke-linecap="round" transform="rotate(32 48 48)" />
      </g>
    </g>
    <text x="${cx}" y="${portrait ? h * 0.16 + logo + h * 0.05 : h * 0.18 + logo + h * 0.06}"
          text-anchor="middle" font-family="Segoe UI, Roboto, sans-serif" font-size="${Math.min(w, h) * 0.062}"
          font-weight="700" fill="#ffffff">Bean Circle</text>
    <text x="${cx}" y="${portrait ? h * 0.16 + logo + h * 0.085 : h * 0.18 + logo + h * 0.1}"
          text-anchor="middle" font-family="Segoe UI, Roboto, sans-serif" font-size="${Math.min(w, h) * 0.03}"
          fill="#f5b878">${label}</text>
    ${cards}
  </svg>`;
}

/* ── Render pipeline ──────────────────────────────────────────────────────── */
async function png(svg, file, size) {
  const out = resolve(root, 'public', file);
  await mkdir(dirname(out), { recursive: true });
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
  console.log('  ✓', file);
}

async function jpg(svg, file, w, h) {
  const out = resolve(root, 'public', file);
  await mkdir(dirname(out), { recursive: true });
  await sharp(Buffer.from(svg)).resize(w, h).jpeg({ quality: 82 }).toFile(out);
  console.log('  ✓', file);
}

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function main() {
  console.log('Generating PWA icons…');
  for (const s of ICON_SIZES) await png(iconSvg(512), `icons/icon-${s}.png`, s);

  console.log('Generating maskable icons…');
  await png(maskableSvg(512), 'icons/maskable-192.png', 192);
  await png(maskableSvg(512), 'icons/maskable-512.png', 512);

  console.log('Generating apple-touch icon…');
  await png(appleSvg(180), 'icons/apple-touch-icon.png', 180);

  console.log('Generating favicons…');
  await png(iconSvg(512), 'icons/favicon-16.png', 16);
  await png(iconSvg(512), 'icons/favicon-32.png', 32);
  await png(iconSvg(512), 'icons/favicon-96.png', 96);
  await writeFile(resolve(root, 'public/favicon.svg'), iconSvg(512));
  console.log('  ✓ favicon.svg');

  console.log('Generating shortcut icons…');
  await png(shortcutSvg(GLYPHS.passport), 'icons/shortcut-passport.png', 96);
  await png(shortcutSvg(GLYPHS.messages), 'icons/shortcut-messages.png', 96);

  console.log('Generating screenshots…');
  await jpg(screenshotSvg(1080, 1920, 'Your coffee passport'), 'screenshots/mobile-1.jpg', 1080, 1920);
  await jpg(screenshotSvg(1080, 1920, 'Discover cafés near you'), 'screenshots/mobile-2.jpg', 1080, 1920);
  await jpg(screenshotSvg(1920, 1080, 'A social network for café lovers'), 'screenshots/wide-1.jpg', 1920, 1080);

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
