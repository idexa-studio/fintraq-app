import { BlurView } from '@sbaiahmed1/react-native-blur';
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

type FrostLayerProps = {
  /** Blur intensity — 80 for screen backdrops, 20–25 for panel frost */
  intensity?: number;
  /** Android solid-color fallback (blur not available on Android) */
  androidColor?: string;
  /** Applied to both BlurView and Android fallback */
  borderRadius?: number;
  style?: ViewStyle;
};

/**
 * Platform-aware blur layer. Renders as absoluteFillObject.
 * iOS: real BlurView. Android: solid-color fallback.
 */
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
      blurAmount={intensity}
      blurType={isDark ? 'dark' : 'light'}
      style={resolvedStyle}
    />
  );
});
