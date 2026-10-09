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
  /** The figure the ring is about, centred inside it. */
  children?: React.ReactNode;
  accessibilityLabel: string;
};

/** A ring split into shares, with the figure it describes in the middle. */
export function Ring({ segments, total, size = 160, thickness = 16, children, accessibilityLabel }: RingProps) {
  const { colors } = useTheme();
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const whole = total ?? segments.reduce((sum, s) => sum + s.value, 0);
  const ring = { cx: size / 2, cy: size / 2, r, strokeWidth: thickness, fill: 'none' as const };
  // Where each share begins along the ring: the lengths of those before it.
  const lengths = segments.map((segment) => (whole > 0 ? (segment.value / whole) * circumference : 0));
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((sum, length) => sum + length, 0));

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Turned a quarter back so the first share starts at twelve o'clock. */}
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle {...ring} stroke={colors.divider} />
        {segments.map((segment, i) => (
          <Circle key={i} {...ring} stroke={segment.color} strokeDasharray={[lengths[i], circumference - lengths[i]]} strokeDashoffset={-starts[i]} />
        ))}
      </Svg>
      {children}
    </View>
  );
}
