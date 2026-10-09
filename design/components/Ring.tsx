import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export type RingSegment = {
  value: number;
  color: string;
};

export type RingProps = {
  /** Shares of a whole, drawn clockwise from the top. One segment makes a progress ring. */
  segments: RingSegment[];
  /** What the segments add up to. Defaults to their sum; set it to leave part of the ring empty. */
  total?: number;
  size?: number;
  thickness?: number;
  /** A point along the ring, 0 to 1 from the top, drawn as a short ink mark: where today falls in a period, to read the fill against. */
  marker?: number;
  /** The figure the ring is about, centred inside it. */
  children?: React.ReactNode;
  accessibilityLabel: string;
};

/** A ring split into shares, with the figure it describes in the middle. */
export function Ring({ segments, total, marker, size = 160, thickness = 16, children, accessibilityLabel }: RingProps) {
  const { colors, border } = useTheme();
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const whole = total ?? segments.reduce((sum, s) => sum + s.value, 0);
  const ring = { cx: size / 2, cy: size / 2, r, strokeWidth: thickness, fill: 'none' as const };
  // Where each share begins along the ring: the lengths of those before it.
  const lengths = segments.map((segment) => (whole > 0 ? (segment.value / whole) * circumference : 0));
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((sum, length) => sum + length, 0));
  const tick = border.thick + 1;
  const at = Math.min(1, Math.max(0, marker ?? 0)) * circumference;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Turned a quarter back so the first share starts at twelve o'clock. */}
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle {...ring} stroke={colors.divider} />
        {segments.map((segment, i) => (
          <Circle key={i} {...ring} stroke={segment.color} strokeDasharray={[lengths[i], circumference - lengths[i]]} strokeDashoffset={-starts[i]} />
        ))}
        {/* The mark: ink with a paler edge either side, so it reads over the fill and over the empty track alike. */}
        {marker === undefined ? null : (
          <>
            <Circle {...ring} stroke={colors.surface} strokeDasharray={[tick * 3, circumference - tick * 3]} strokeDashoffset={-(at - tick * 1.5)} />
            <Circle {...ring} stroke={colors.text} strokeDasharray={[tick, circumference - tick]} strokeDashoffset={-(at - tick / 2)} />
          </>
        )}
      </Svg>
      {children}
    </View>
  );
}
