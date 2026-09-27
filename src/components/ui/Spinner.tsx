import { useTheme } from '@/src/providers/ThemeProvider';
import React from 'react';
import { ActivityIndicator, StyleProp, ViewStyle } from 'react-native';

type SpinnerProps = {
  /** sm — inline next to text or inside controls · lg — a section still loading. */
  size?: 'sm' | 'lg';
  /** Defaults to the brand ink green; pass colors.primaryForeground on lime fills. */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Inline progress for short, in-place work (searching, connecting, loading
 * prices). For content that is loading, prefer Skeleton / SkeletonScreen so the
 * layout doesn't jump; for button actions use Button's isLoading.
 */
export const Spinner = React.memo(function Spinner({ size = 'sm', color, style }: SpinnerProps) {
  const { colors } = useTheme();
  return (
    <ActivityIndicator
      size={size === 'lg' ? 'large' : 'small'}
      color={color ?? colors.primaryInk}
      style={style}
      accessibilityLabel="Loading"
    />
  );
});
