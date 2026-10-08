import { useTheme } from '@/design/ThemeProvider';
import React, { useEffect } from 'react';
import type { DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

export type SkeletonProps = {
  width?: DimensionValue;
  height: number;
  /** Round, for a leading circle. */
  circle?: boolean;
};

/** A placeholder in the shape of content that is still loading. */
export function Skeleton({ width = '100%', height, circle = false }: SkeletonProps) {
  const { colors, radius, motion } = useTheme();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.45, { duration: motion.slow * 2 }), -1, true);
  }, [pulse, motion.slow]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: circle ? height : width, height, borderRadius: circle ? height / 2 : radius.sm, backgroundColor: colors.divider }, style]}
    />
  );
}
