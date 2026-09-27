import { useTheme } from '@/src/providers/ThemeProvider';
import type { RadiusToken } from '@/src/theme/tokens';
import React, { useEffect } from 'react';
import { DimensionValue, StyleProp, View, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: RadiusToken;
  /** Render a circle of `height` diameter — avatars. */
  circle?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Pulsing placeholder shown while data loads. Match the shape of the content it replaces. */
export const Skeleton = React.memo(function Skeleton({
  width = '100%',
  height = 14,
  radius = 'sm',
  circle = false,
  style,
}: SkeletonProps) {
  const theme = useTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: circle ? height : width,
          height,
          borderRadius: circle ? theme.radius('full') : theme.radius(radius),
          backgroundColor: theme.colors.card,
        },
        animatedStyle,
        style,
      ]}
    />
  );
});

/** Skeleton shaped like a ListItem / TransactionRow. */
export const SkeletonRow = React.memo(function SkeletonRow() {
  const { spacing, colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing('3.5'), padding: spacing('4'), backgroundColor: colors.surface }}>
      <Skeleton width={36} height={36} radius="md" />
      <View style={{ flex: 1, gap: spacing('2') }}>
        <Skeleton width="55%" height={12} />
        <Skeleton width="35%" height={10} />
      </View>
      <Skeleton width={56} height={12} />
    </View>
  );
});

/**
 * Generic screen placeholder: a hero block and a group of rows. Use while a
 * whole screen's data loads instead of a centred spinner.
 */
export const SkeletonScreen = React.memo(function SkeletonScreen({ hero = true, rows = 4 }: { hero?: boolean; rows?: number }) {
  const { spacing, layout, radius } = useTheme();
  return (
    <View style={{ paddingHorizontal: layout.screenPadding, paddingTop: spacing('4'), gap: spacing('5') }} accessibilityLabel="Loading">
      {hero ? <Skeleton height={160} radius="2xl" /> : null}
      <Skeleton width="35%" height={14} />
      <View style={{ borderRadius: radius('xl'), overflow: 'hidden' }}>
        {Array.from({ length: rows }, (_, i) => <SkeletonRow key={i} />)}
      </View>
    </View>
  );
});
