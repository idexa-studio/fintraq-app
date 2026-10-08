#!/usr/bin/env node
/**
 * Draws the app icon, the splash mark, the notification icon and the launcher
 * shortcut icons from one description of the mark, in the design system's
 * colours. The SVG of each is kept in assets/brand, the PNG the app uses in
 * assets/images.
 *
 *   npm install --no-save sharp     # not kept installed; remove node_modules/sharp and node_modules/@img after
 *   npm run brand:generate
 *   npm run brand:generate -- --sheet out.png   # also one sheet of everything, to look at
 *
 * The mark is a stack of coins on a 392 by 474 grid: a white coin resting on a
 * black one, both seen from the edge, and a green one falling onto them. Its
 * shapes and its colours are set here and nowhere else; the Design Gallery's
 * brand section (features/gallery/sections/BrandSection.tsx) draws the same
 * numbers so the mark can be looked at on a phone.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const BRAND = path.join(ROOT, 'assets/brand');
const IMAGES = path.join(ROOT, 'assets/images');

// The same values as design/tokens/colors.ts.
const INK = '#000000';
const WHITE = '#FFFFFF';
const PAGE = '#F1F1F1'; // light background
const DARK_SURFACE = '#1A1A1A'; // dark surface
const PASTEL_GREEN = '#6CF579'; // the pastel green of the icon circles
// The falling coin. Brand green (#11B67A) was tried beside it and goes dark against its black edge at launcher size.
const COIN = PASTEL_GREEN;

const CANVAS = 1024;
const MARK = { width: 392, height: 474 };
// The falling coin is lighter than the stack, so the mark sits a little above the middle to look centred.
const LIFT = 10;
/** One line weight for every outline in the mark. */
const LINE = 14;

// The falling coin: its half width, how flat it looks, its lean, its thickness, and the room it takes.
const FALL = { half: 104, flat: 0.56, lean: -16, thick: 26, air: 150 };
// A coin seen from its edge is a pill. The two in the stack sit close; the falling one hangs above them.
const EDGE = { height: 136, radius: 68 };
const DROP = 40;
const REST = 12;

/**
 * The mark's shapes. `line` draws every outline and the lower coin, `paper` fills the upper coin,
 * `coin` fills the falling one. With `solid`, it is one colour and no fills: a silhouette.
 */
function mark({ line, paper, coin, solid = false }) {
  const inset = LINE / 2;
  const cx = MARK.width / 2;
  const cy = FALL.air / 2;
  const rx = FALL.half - inset;
  const ry = (FALL.half * FALL.flat - inset).toFixed(2);
  const upperTop = FALL.air + DROP;
  const lowerTop = upperTop + EDGE.height + REST;
  const stroke = `stroke="${line}" stroke-width="${LINE}"`;
  return [
    `<g transform="rotate(${FALL.lean} ${cx} ${cy})">`,
    `<ellipse cx="${cx}" cy="${cy + FALL.thick / 2}" rx="${rx}" ry="${ry}" fill="${line}" ${stroke}/>`,
    `<rect x="${cx - FALL.half}" y="${cy - FALL.thick / 2}" width="${FALL.half * 2}" height="${FALL.thick}" fill="${line}"/>`,
    `<ellipse cx="${cx}" cy="${cy - FALL.thick / 2}" rx="${rx}" ry="${ry}" fill="${solid ? line : coin}" ${stroke}/>`,
    `</g>`,
    `<rect x="${inset}" y="${upperTop + inset}" width="${MARK.width - LINE}" height="${EDGE.height - LINE}" rx="${EDGE.radius - inset}" fill="${solid ? 'none' : paper}" ${stroke}/>`,
    `<rect x="0" y="${lowerTop}" width="${MARK.width}" height="${EDGE.height}" rx="${EDGE.radius}" fill="${line}"/>`,
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

const ON_LIGHT = { line: INK, paper: WHITE, coin: COIN };
const ON_DARK = { line: WHITE, paper: DARK_SURFACE, coin: COIN };
const SILHOUETTE = (c) => ({ line: c, solid: true });

/**
 * How large the mark is drawn on the 1024 canvas.
 * - A launcher shows the middle two thirds of an adaptive icon; at 0.78 the mark is 54% of what
 *   is shown and well inside the 66dp safe circle, with air on every side.
 * - A full-square icon (iOS, the stores) shows all of the canvas, so the same 54% is 1.17.
 * - Android cuts its splash icon to a circle two thirds of the canvas wide; 1.17 stays inside it.
 * - A notification icon is 24dp with 2dp of padding: 80 of its 96 pixels.
 */
const SCALE = { adaptive: 0.78, square: 1.17, splash: 1.17, notification: (CANVAS * 80) / 96 / MARK.height };

/** The launcher shortcuts: a glyph from the design system in black on the pastel green (set in app.json), as the app's icon circles are. */
const SHORTCUTS = { expense: 'arrow-up-right', income: 'arrow-down-left', transfer: 'arrows-left-right', loan: 'hand-coins' };
const SHORTCUT_CANVAS = 432;
// A shortcut shows the middle two thirds too: 144 of 432 is a 24dp glyph in a 48dp circle.
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
  return svg(`<g transform="translate(${offset},${offset}) scale(${scale})"><path fill="${INK}" d="${glyphPath(name)}"/></g>`, SHORTCUT_CANVAS);
}

function notification() {
  const s = SCALE.notification;
  const x = CANVAS / 2 - (MARK.width / 2) * s;
  const y = CANVAS / 2 - (MARK.height / 2) * s;
  return svg(`<g transform="translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${s.toFixed(4)})">${mark(SILHOUETTE(WHITE))}</g>`);
}

const ground = (colour, radius = 0) => `<rect width="${CANVAS}" height="${CANVAS}" rx="${radius}" fill="${colour}"/>`;

/** [svg file, png file (in assets/images unless it starts with brand:), png size, drawing] */
const ASSETS = [
  ['icon.svg', 'icon.png', 1024, svg(ground(PAGE) + placed(ON_LIGHT, SCALE.square))],
  ['icon-dark.svg', 'icon-dark.png', 1024, svg(placed(ON_DARK, SCALE.square))],
  ['icon-tinted.svg', 'icon-tinted.png', 1024, svg(placed({ line: WHITE, paper: 'none', coin: '#9A9A9A' }, SCALE.square))],
  ['adaptive-foreground.svg', 'adaptive-icon/foreground.png', 1024, svg(placed(ON_LIGHT, SCALE.adaptive))],
  ['android-monochrome.svg', 'android-icon-monochrome.png', 1024, svg(placed(SILHOUETTE(INK), SCALE.adaptive))],
  ['splash-mark.svg', 'splash.png', 1024, svg(placed(ON_LIGHT, SCALE.splash))],
  ['splash-mark-dark.svg', 'splash-dark.png', 1024, svg(placed(ON_DARK, SCALE.splash))],
  ['notification.svg', 'notification-icon.png', 96, notification()],
  ['favicon.svg', 'favicon.png', 48, svg(ground(PAGE, 224) + placed(ON_LIGHT, SCALE.square))],
  // The store listing's icon: the full square, 512 pixels, no transparency.
  ['icon.svg', 'brand:store-icon-512.png', 512, svg(ground(PAGE) + placed(ON_LIGHT, SCALE.square))],
  ...Object.entries(SHORTCUTS).map(([id, glyph]) => [`shortcut-${id}.svg`, `shortcuts/shortcut-${id}.png`, SHORTCUT_CANVAS, shortcut(glyph)]),
];

const target = (output) => (output.startsWith('brand:') ? path.join(BRAND, output.slice(6)) : path.join(IMAGES, output));

async function sheet(file) {
  const tile = 256;
  const gap = 24;
  const shown = [
    ['icon.png', PAGE], ['adaptive-icon/foreground.png', PAGE], ['android-icon-monochrome.png', '#C9D7E8'], ['splash.png', PAGE],
    ['splash-dark.png', INK], ['icon-dark.png', '#1C1C1E'], ['icon-tinted.png', '#3A3A3A'], ['notification-icon.png', '#3A3A3A'],
    ...Object.keys(SHORTCUTS).map((id) => [`shortcuts/shortcut-${id}.png`, PASTEL_GREEN]),
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
    // A store icon may carry no transparency.
    const opaque = output === 'icon.png' || output.startsWith('brand:');
    await (opaque ? image.flatten({ background: PAGE }) : image).png({ compressionLevel: 9 }).toFile(target(output));
    console.log(`${output}  ${size}px`);
  }
  const at = process.argv.indexOf('--sheet');
  if (at > -1) await sheet(path.resolve(process.argv[at + 1]));
}

main().catch((e) => { console.error(e); process.exit(1); });
