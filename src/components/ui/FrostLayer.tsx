import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

type FrostLayerProps = {
  /** Blur intensity 1–100. 80 for screen backdrops, 20–25 for panel frost. */
  intensity?: number;
  /**
   * Enable experimental Android blur (dimezisBlurView). Only use for full-screen
   * hero backgrounds — can cause performance issues on UI components.
   */
  experimentalAndroid?: boolean;
  borderRadius?: number;
  style?: ViewStyle;
};

export const FrostLayer = React.memo(function FrostLayer({
  intensity = 80,
  experimentalAndroid = false,
  borderRadius,
  style,
}: FrostLayerProps) {
  const { isDark } = useTheme();

  const resolvedStyle: ViewStyle = {
    ...StyleSheet.absoluteFillObject,
    borderRadius,
    ...style,
  };

  if (Platform.OS === 'android' && !experimentalAndroid) {
    return (
      <View
        style={[resolvedStyle, { backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.65)' }]}
        pointerEvents="none"
      />
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={isDark ? 'dark' : 'light'}
      style={resolvedStyle}
      pointerEvents="none"
      {...(Platform.OS === 'android' ? {
        experimentalBlurMethod: 'dimezisBlurView' as const,
        blurReductionFactor: 1,
      } : {})}
    />
  );
});
