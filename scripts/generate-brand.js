#!/usr/bin/env node
/**
 * Draws the app icon, the splash mark, the notification icon and the launcher
 * shortcut icons from one description of the mark, in the design system's
 * colours. The SVG of each is kept in assets/brand, the PNG the app uses in
 * assets/images.
 *
 *   npm install --no-save sharp     # not kept installed; remove node_modules/sharp after
 *   npm run brand:generate
 *   npm run brand:generate -- --sheet out.png   # also one sheet of everything, to look at
 *
 * The mark is a coin over two bars, on a 392 by 496 grid. Its shapes and its
 * colours are set here and nowhere else.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const BRAND = path.join(ROOT, 'assets/brand');
const IMAGES = path.join(ROOT, 'assets/images');

// The same values as design/tokens/colors.ts: accent, the dark page, the light page, white.
const GREEN = '#0AE449';
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const PAGE = '#F1F1F1';

const CANVAS = 1024;
const MARK = { width: 392, height: 496 };
// The coin is lighter than the bars, so the mark sits a little above the middle to look centred.
const LIFT = 20;

/** The mark's three shapes. The ring and the gap inside it are near equal, so the coin survives at launcher size. */
function mark({ coin, upper, lower }) {
  const ring = (r) => `M${196 - r} 80 a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  return [
    `<path fill-rule="evenodd" fill="${coin}" d="${ring(80)} ${ring(60)} ${ring(44)}"/>`,
    `<rect x="0" y="192" width="392" height="136" rx="68" fill="${upper}"/>`,
    `<rect x="0" y="360" width="392" height="136" rx="68" fill="${lower}"/>`,
  ].join('');
}

function placed(colors, scale) {
  const x = CANVAS / 2 - (MARK.width / 2) * scale;
  const y = CANVAS / 2 - (MARK.height / 2 + LIFT) * scale;
  return `<g transform="translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${scale})">${mark(colors)}</g>`;
}

function svg(body, size = CANVAS) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>\n`;
}

const ON_DARK = { coin: GREEN, upper: GREEN, lower: WHITE };
const ON_LIGHT = { coin: GREEN, upper: GREEN, lower: BLACK };
const ONE_COLOUR = (c) => ({ coin: c, upper: c, lower: c });

// How large the mark is drawn on the 1024 canvas. An adaptive icon and the Android splash are
// cut to a circle two thirds of the canvas wide, so those stay inside it.
const SCALE = { icon: 1.25, adaptive: 1.0, splash: 1.1 };

/** The launcher shortcuts: a glyph from the design system, in the accent, on the icon's black. */
const SHORTCUTS = { expense: 'arrow-up-right', income: 'arrow-down-left', transfer: 'arrows-left-right', loan: 'hand-coins' };
const SHORTCUT_CANVAS = 432;
const SHORTCUT_GLYPH = 144;

function glyphPath(name) {
  const source = fs.readFileSync(path.join(ROOT, 'design/icons/glyphs.ts'), 'utf8');
  const found = source.match(new RegExp(`'${name}': \\{ line: '([^']+)'`));
  if (!found) throw new Error(`No glyph named ${name}`);
  return found[1];
}

function shortcut(name) {
  const scale = SHORTCUT_GLYPH / 256;
  const offset = (SHORTCUT_CANVAS - SHORTCUT_GLYPH) / 2;
  return svg(`<g transform="translate(${offset},${offset}) scale(${scale})"><path fill="${GREEN}" d="${glyphPath(name)}"/></g>`, SHORTCUT_CANVAS);
}

/** [svg file, png file, png size, drawing] */
const ASSETS = [
  ['icon.svg', 'icon.png', 1024, svg(`<rect width="1024" height="1024" fill="${BLACK}"/>${placed(ON_DARK, SCALE.icon)}`)],
  ['icon-dark.svg', 'icon-dark.png', 1024, svg(placed(ON_DARK, SCALE.icon))],
  ['icon-tinted.svg', 'icon-tinted.png', 1024, svg(placed({ coin: WHITE, upper: WHITE, lower: '#9A9A9A' }, SCALE.icon))],
  ['adaptive-foreground.svg', 'adaptive-icon/foreground.png', 1024, svg(placed(ON_DARK, SCALE.adaptive))],
  ['android-monochrome.svg', 'android-icon-monochrome.png', 1024, svg(placed(ONE_COLOUR(BLACK), SCALE.adaptive))],
  ['splash-mark.svg', 'splash.png', 1024, svg(placed(ON_LIGHT, SCALE.splash))],
  ['splash-mark-dark.svg', 'splash-dark.png', 1024, svg(placed(ON_DARK, SCALE.splash))],
  ['notification.svg', 'notification-icon.png', 96, svg(`<g transform="translate(142,16) scale(2)">${mark(ONE_COLOUR(WHITE))}</g>`)],
  ['favicon.svg', 'favicon.png', 48, svg(`<rect width="1024" height="1024" rx="224" fill="${BLACK}"/>${placed(ON_DARK, 1.3)}`)],
  ...Object.entries(SHORTCUTS).map(([id, glyph]) => [`shortcut-${id}.svg`, `shortcuts/shortcut-${id}.png`, SHORTCUT_CANVAS, shortcut(glyph)]),
];

async function sheet(file) {
  const tile = 256;
  const gap = 24;
  const shown = [
    ['icon.png', BLACK], ['adaptive-icon/foreground.png', BLACK], ['android-icon-monochrome.png', '#C9D7E8'],
    ['splash.png', PAGE], ['splash-dark.png', BLACK], ['icon-tinted.png', '#3A3A3A'], ['notification-icon.png', '#3A3A3A'],
    ...Object.keys(SHORTCUTS).map((id) => [`shortcuts/shortcut-${id}.png`, BLACK]),
  ];
  const columns = 4;
  const rows = Math.ceil(shown.length / columns);
  const tiles = await Promise.all(shown.map(async ([name, background], i) => ({
    input: await sharp(path.join(IMAGES, name)).resize(tile, tile).flatten({ background }).png().toBuffer(),
    left: gap + (i % columns) * (tile + gap),
    top: gap + Math.floor(i / columns) * (tile + gap),
  })));
  await sharp({ create: { width: gap + columns * (tile + gap), height: gap + rows * (tile + gap), channels: 3, background: '#8A8A8A' } })
    .composite(tiles).png().toFile(file);
}

async function main() {
  for (const [source, output, size, drawing] of ASSETS) {
    fs.writeFileSync(path.join(BRAND, source), drawing);
    const image = sharp(Buffer.from(drawing), { density: 72 * Math.max(1, size / 256) }).resize(size, size);
    // The store icon may carry no transparency.
    await (output === 'icon.png' ? image.flatten({ background: BLACK }) : image).png({ compressionLevel: 9 }).toFile(path.join(IMAGES, output));
    console.log(`${output}  ${size}px`);
  }
  const at = process.argv.indexOf('--sheet');
  if (at > -1) await sheet(path.resolve(process.argv[at + 1]));
}

main().catch((e) => { console.error(e); process.exit(1); });
