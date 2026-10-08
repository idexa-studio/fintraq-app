import { useTheme } from '@/design/ThemeProvider';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

export type ProgressBarProps = {
  /** 0 to 1. Leave out while the amount of work is not known: the bar then travels instead of filling. */
  value?: number;
  /** Over the limit: the fill turns red. */
  over?: boolean;
  accessibilityLabel: string;
};

/** The share of the track the travelling piece covers while the amount of work is unknown. */
const TRAVELLER = 0.35;

/** How far along, or how much of a limit is used. */
export function ProgressBar({ value, over = false, accessibilityLabel }: ProgressBarProps) {
  const { colors, space, radius, motion, border } = useTheme();
  const [width, setWidth] = useState(0);
  const unknown = value === undefined;
  const share = Math.min(1, Math.max(0, value ?? 0));
  const travel = useSharedValue(0);

  // Keeps travelling even with Reduce Motion on, so unfinished work never looks stuck.
  useEffect(() => {
    if (unknown) travel.value = withRepeat(withTiming(1, { duration: motion.spin, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.Never }), -1, true, undefined, ReduceMotion.Never);
  }, [unknown, travel, motion.spin]);

  const moving = useAnimatedStyle(() => ({ transform: [{ translateX: travel.value * width * (1 - TRAVELLER) }] }));
  // The green is too light to show against the track by itself, so the bar is
  // drawn like the switch: outlined track, and a line where the fill ends.
  const fill = { height: '100%' as const, backgroundColor: over ? colors.danger : colors.accent, borderRightWidth: border.thin, borderColor: colors.border };

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={unknown ? undefined : { min: 0, max: 100, now: Math.round(share * 100) }}
      accessibilityState={{ busy: unknown }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: space.sm + space.xxs, borderRadius: radius.pill, borderWidth: border.thin, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' }}
    >
      {unknown ? (
        <Animated.View style={[fill, { width: `${TRAVELLER * 100}%`, borderLeftWidth: border.thin }, moving]} />
      ) : share > 0 ? (
        <View style={[fill, { width: `${share * 100}%` }, share >= 1 ? { borderRightWidth: 0 } : null]} />
      ) : null}
    </View>
  );
}
