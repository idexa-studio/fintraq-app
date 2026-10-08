import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export type GaugeProps = {
  /** 0 to 1. */
  value: number;
  /** Past the limit: the arc turns red. */
  over?: boolean;
  width?: number;
  thickness?: number;
  /** The figure, sitting in the mouth of the arc. */
  children?: React.ReactNode;
  accessibilityLabel: string;
};

/** A half circle that fills from left to right: how much of an allowance is used. */
export function Gauge({ value, over = false, width = 220, thickness = 16, children, accessibilityLabel }: GaugeProps) {
  const { colors } = useTheme();
  const r = (width - thickness) / 2;
  const half = Math.PI * r;
  const share = Math.min(1, Math.max(0, value));
  const arc = { cx: width / 2, cy: width / 2, r, strokeWidth: thickness, fill: 'none' as const, strokeLinecap: 'round' as const };
  const height = width / 2 + thickness / 2;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(share * 100) }}
      style={{ width, height, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' }}
    >
      {/* A full circle turned half way round, of which only the top half is shown. */}
      <Svg width={width} height={width} style={{ position: 'absolute', top: 0, transform: [{ rotate: '180deg' }] }}>
        <Circle {...arc} stroke={colors.divider} strokeDasharray={[half, half * 2]} />
        {/* Black, not the accent green: the green is too light to tell from the track. */}
        <Circle {...arc} stroke={over ? colors.danger : colors.text} strokeDasharray={[half * share, half * 3]} />
      </Svg>
      {children}
    </View>
  );
}
