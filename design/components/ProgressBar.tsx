import { useTheme } from '@/design/ThemeProvider';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

export type ProgressBarProps = {
  /** 0 to 1. Leave out while the amount of work is not known: the bar then travels instead of filling. */
  value?: number;
  /** Over the limit: the fill turns red. */
  over?: boolean;
  /** Close to the limit, not yet over: the fill turns amber. */
  near?: boolean;
  accessibilityLabel: string;
};

/** The share of the track the travelling piece covers while the amount of work is unknown. */
const TRAVELLER = 0.35;

/** How far along, or how much of a limit is used. */
export function ProgressBar({ value, over = false, near = false, accessibilityLabel }: ProgressBarProps) {
  const { colors, space, radius, motion, border } = useTheme();
  const [width, setWidth] = useState(0);
  const unknown = value === undefined;
  const share = Math.min(1, Math.max(0, value ?? 0));
  // The fill grows to its value instead of appearing at it.
  const filled = useSharedValue(0);
  useEffect(() => {
    filled.value = withTiming(share, { duration: motion.slow * 2, easing: Easing.out(Easing.cubic) });
  }, [share, filled, motion.slow]);
  const growing = useAnimatedStyle(() => ({ width: `${filled.value * 100}%` }));
  const travel = useSharedValue(0);

  // Keeps travelling even with Reduce Motion on, so unfinished work never looks stuck.
  useEffect(() => {
    if (unknown) travel.value = withRepeat(withTiming(1, { duration: motion.spin, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.Never }), -1, true, undefined, ReduceMotion.Never);
  }, [unknown, travel, motion.spin]);

  const moving = useAnimatedStyle(() => ({ transform: [{ translateX: travel.value * width * (1 - TRAVELLER) }] }));
  // The green is too light to show against the track by itself, so the bar is
  // drawn like the switch: outlined track, and a line where the fill ends.
  const fill = { height: '100%' as const, backgroundColor: over ? colors.danger : near ? colors.warning : colors.accent, borderRightWidth: border.thin, borderColor: colors.border };

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
        <Animated.View style={[fill, growing, share >= 1 ? { borderRightWidth: 0 } : null]} />
      ) : null}
    </View>
  );
}
