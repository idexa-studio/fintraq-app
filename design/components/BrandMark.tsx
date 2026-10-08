import { INK, LIGHT_COLORS, PASTELS } from '@/design/tokens/colors';
import React from 'react';
import Svg, { Ellipse, G, Rect } from 'react-native-svg';

/** The grid the mark is drawn on, and so its proportions. */
export const BRAND_MARK = { width: 392, height: 474 };

/** One line weight for every outline in the mark. */
const LINE = 14;
// The falling coin: its half width, how flat it looks, its lean, its thickness, and the room it takes.
const FALL = { half: 104, flat: 0.56, lean: -16, thick: 26, air: 150 };
// A coin seen from its edge is a pill. The two in the stack sit close; the falling one hangs above them.
const EDGE = { height: 136, radius: 68 };
const DROP = 40;
const REST = 12;

export type BrandMarkProps = {
  /** Its width; the height follows from the grid. */
  width: number;
  /** The falling coin's colour, where a screen compares it. The pastel green otherwise. */
  coin?: string;
};

/**
 * Fintraq's mark, the same in both schemes: a stack of coins, a white one resting on a black one,
 * and a green one falling onto them. `scripts/generate-brand.js` draws the app icon and the splash
 * from these same numbers; change them in both.
 */
export function BrandMark({ width, coin = PASTELS.green }: BrandMarkProps) {
  const inset = LINE / 2;
  const cx = BRAND_MARK.width / 2;
  const cy = FALL.air / 2;
  const rx = FALL.half - inset;
  const ry = FALL.half * FALL.flat - inset;
  const upperTop = FALL.air + DROP;
  const lowerTop = upperTop + EDGE.height + REST;
  const line = { stroke: INK, strokeWidth: LINE };
  return (
    <Svg width={width} height={(width * BRAND_MARK.height) / BRAND_MARK.width} viewBox={`0 0 ${BRAND_MARK.width} ${BRAND_MARK.height}`}>
      <G transform={`rotate(${FALL.lean} ${cx} ${cy})`}>
        {/* The coin's edge: its underside, and the band between that and its face. */}
        <Ellipse cx={cx} cy={cy + FALL.thick / 2} rx={rx} ry={ry} fill={INK} {...line} />
        <Rect x={cx - FALL.half} y={cy - FALL.thick / 2} width={FALL.half * 2} height={FALL.thick} fill={INK} />
        <Ellipse cx={cx} cy={cy - FALL.thick / 2} rx={rx} ry={ry} fill={coin} {...line} />
      </G>
      <Rect x={inset} y={upperTop + inset} width={BRAND_MARK.width - LINE} height={EDGE.height - LINE} rx={EDGE.radius - inset} fill={LIGHT_COLORS.surface} {...line} />
      <Rect x={0} y={lowerTop} width={BRAND_MARK.width} height={EDGE.height} rx={EDGE.radius} fill={INK} />
    </Svg>
  );
}
