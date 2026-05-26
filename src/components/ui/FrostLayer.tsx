import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

type FrostLayerProps = {
  /** Blur intensity 1–100. 80 for screen backdrops, 20–25 for panel frost. */
  intensity?: number;
  /** Android solid-color fallback (expo-blur Android blur is experimental). */
  androidColor?: string;
  /** Applied to both BlurView and Android fallback. */
  borderRadius?: number;
  style?: ViewStyle;
};

export const FrostLayer = React.memo(function FrostLayer({
  intensity = 80,
  androidColor,
  borderRadius,
  style,
}: FrostLayerProps) {
  const { isDark } = useTheme();

  const resolvedStyle: ViewStyle = {
    ...StyleSheet.absoluteFillObject,
    borderRadius,
    ...style,
  };

  if (Platform.OS === 'android') {
    return (
      <View
        style={[resolvedStyle, { backgroundColor: androidColor ?? 'transparent' }]}
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
    />
  );
});
