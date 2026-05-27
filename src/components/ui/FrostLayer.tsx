import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

type FrostLayerProps = {
  /** Blur intensity 1–100. 80 for screen backdrops, 20–25 for panel frost. */
  intensity?: number;
  /** Applied to BlurView. */
  borderRadius?: number;
  style?: ViewStyle;
};

export const FrostLayer = React.memo(function FrostLayer({
  intensity = 80,
  borderRadius,
  style,
}: FrostLayerProps) {
  const { isDark } = useTheme();

  const resolvedStyle: ViewStyle = {
    ...StyleSheet.absoluteFillObject,
    borderRadius,
    ...style,
  };

  return (
    <BlurView
      intensity={intensity}
      tint={isDark ? 'dark' : 'light'}
      style={resolvedStyle}
      pointerEvents="none"
    />
  );
});
