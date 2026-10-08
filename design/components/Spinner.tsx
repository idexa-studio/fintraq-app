import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { useTheme } from '@/design/ThemeProvider';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

export type SpinnerProps = {
  size?: number;
  /** Ring colour; defaults to the text colour. Pass the label colour inside a button. */
  color?: string;
  /** Drawn still in the centre, e.g. a lock while something secure is in progress. */
  icon?: IconName;
  accessibilityLabel?: string;
};

const SEGMENTS = 6;
const GAP_SHARE = 0.2;

/** A ring of dashes with one green dash travelling round it. */
export function Spinner({ size, color, icon, accessibilityLabel = 'Loading' }: SpinnerProps) {
  const theme = useTheme();
  const diameter = size ?? theme.size.spinner;
  const stroke = Math.max(2, diameter / 26);
  const r = (diameter - stroke) / 2;
  const segment = (2 * Math.PI * r) / SEGMENTS;
  const dash = segment * (1 - GAP_SHARE);
  const turn = useSharedValue(0);

  // Keeps turning even with Reduce Motion on: a frozen spinner reads as a hung app. It is small and slow.
  useEffect(() => {
    turn.value = withRepeat(withTiming(1, { duration: theme.motion.spin * SEGMENTS, easing: Easing.linear, reduceMotion: ReduceMotion.Never }), -1, false, undefined, ReduceMotion.Never);
  }, [turn, theme.motion.spin]);

  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 360}deg` }] }));
  const ring = { cx: diameter / 2, cy: diameter / 2, r, strokeWidth: stroke, fill: 'none' as const, strokeLinecap: 'round' as const };

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      style={{ width: diameter, height: diameter, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={diameter} height={diameter} style={{ position: 'absolute' }}>
        <Circle {...ring} stroke={color ?? theme.colors.text} strokeDasharray={[dash, segment - dash]} />
      </Svg>
      <Animated.View style={[{ position: 'absolute' }, spin]}>
        <Svg width={diameter} height={diameter}>
          <Circle {...ring} stroke={theme.colors.accent} strokeDasharray={[dash, segment * SEGMENTS - dash]} />
        </Svg>
      </Animated.View>
      {icon ? <Icon name={icon} size={diameter * 0.3} color={color} /> : null}
    </View>
  );
}
