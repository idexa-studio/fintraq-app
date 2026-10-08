import { Specimen } from '@/features/gallery/components/Specimen';
import { INK, LIGHT_COLORS, PASTELS, Section, useTheme } from '@/design';
import React from 'react';
import { View } from 'react-native';
import Svg, { Ellipse, G, Rect } from 'react-native-svg';

// The icon is the same in both themes, so its white and its page are the light theme's.
const WHITE = LIGHT_COLORS.surface;
const PAGE = LIGHT_COLORS.background;

/** The launcher draws an icon about this large, and shows the middle two thirds of its canvas. */
const LAUNCHER = 60;
const CANVAS = 1024;
/** How large the mark is drawn on its grid: just over half the height of the icon the launcher shows, so it has air on every side. */
const SCALE = 0.78;
const SHOWN = (CANVAS * 2) / 3 / SCALE;
/** One line weight for every outline in the mark. */
const LINE = 14;

/** How the falling coin is drawn: its half width, its lean, how far off the middle, how thick, and whether its face has a rim. */
type Fall = { half: number; lean: number; aside: number; thick: number; rim: boolean };
type MarkProps = { size: number; fall: Fall; coin: string; shape: 'circle' | 'squircle' };

// A coin seen from its edge is a pill; the two in the stack sit close, and the one falling hangs above them.
const EDGE = { height: 136, radius: 68 };
const DROP = 40;
const REST = 12;
/** The room the falling coin takes above the stack, and how flat it looks from where we stand. */
const AIR = 150;
const FLAT = 0.56;

/**
 * The mark as scripts/generate-brand.js draws it, on a 392 by 474 grid. It is a stack of coins:
 * a white one resting on a black one, seen from the edge, and one in colour falling onto them.
 */
function Mark({ size, fall, coin, shape }: MarkProps) {
  const x = CANVAS / 2 - 196;
  const y = CANVAS / 2 - 247;
  const inset = LINE / 2;
  const from = (CANVAS - SHOWN) / 2;
  const upperTop = AIR + DROP;
  const lowerTop = upperTop + EDGE.height + REST;
  const cx = x + 196 + fall.aside;
  const cy = y + AIR / 2;
  const rx = fall.half - inset;
  const ry = fall.half * FLAT - inset;
  const line = { stroke: INK, strokeWidth: LINE };
  return (
    <View style={{ width: size, height: size, borderRadius: shape === 'circle' ? size / 2 : size * 0.3, overflow: 'hidden', backgroundColor: PAGE }}>
      <Svg width={size} height={size} viewBox={`${from} ${from} ${SHOWN} ${SHOWN}`}>
        <G transform={`rotate(${fall.lean} ${cx} ${cy})`}>
          {/* The coin's edge: its underside, and the band between that and its face. */}
          <Ellipse cx={cx} cy={cy + fall.thick / 2} rx={rx} ry={ry} fill={INK} {...line} />
          <Rect x={cx - fall.half} y={cy - fall.thick / 2} width={fall.half * 2} height={fall.thick} fill={INK} />
          <Ellipse cx={cx} cy={cy - fall.thick / 2} rx={rx} ry={ry} fill={coin} {...line} />
          {fall.rim ? <Ellipse cx={cx} cy={cy - fall.thick / 2} rx={rx * 0.58} ry={ry * 0.58} fill="none" stroke={INK} strokeWidth={LINE * 0.8} /> : null}
        </G>
        <Rect x={x + inset} y={y + upperTop + inset} width={392 - LINE} height={EDGE.height - LINE} rx={EDGE.radius - inset} fill={WHITE} {...line} />
        <Rect x={x} y={y + lowerTop} width={392} height={EDGE.height} rx={EDGE.radius} fill={INK} />
      </Svg>
    </View>
  );
}

/** The falling coin as chosen (owner, 2026-10-08): a thick edge and a gentle lean. */
const FALL: Fall = { half: 104, lean: -16, aside: 0, thick: 26, rim: false };

/** The app icon at launcher size: a stack of coins with one falling onto it. */
export function BrandSection() {
  const { colors, space } = useTheme();
  const tones = [
    { name: 'Soft green', note: 'The pastel green of the icon circles. The icon as it ships.', coin: PASTELS.green },
    { name: 'Brand green', note: 'The green of the wave card, for comparison. Richer when large, darker when small.', coin: colors.brand },
  ];
  return (
    <Section title="App icon">
      {tones.map(({ name, note, coin }) => (
        <Specimen key={name} name={name} note={note}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, backgroundColor: PASTELS.teal }}>
            <Mark size={LAUNCHER * 2} fall={FALL} coin={coin} shape="squircle" />
            <Mark size={LAUNCHER} fall={FALL} coin={coin} shape="squircle" />
            <Mark size={LAUNCHER} fall={FALL} coin={coin} shape="circle" />
            <Mark size={LAUNCHER * 0.6} fall={FALL} coin={coin} shape="circle" />
          </View>
        </Specimen>
      ))}
    </Section>
  );
}
