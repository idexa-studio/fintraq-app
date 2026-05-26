import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { FrostLayer } from './FrostLayer';

export type BlurCircle = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  width: number;
  height: number;
  color: string;
};

type BlurBackgroundProps = {
  /** Override decorative circles. Pass `[]` for blur-only (no circles). */
  circles?: BlurCircle[];
  /** Override blur intensity (default: 80 iOS / 96 Android). */
  blurAmount?: number;
  /** Two-char hex opacity suffix for Android translucency overlay, e.g. '60'. */
  androidOverlayOpacity?: string;
};

/**
 * Full-screen frosted-glass background: decorative circles → FrostLayer →
 * Android translucency overlay. Drop as first child of any SafeAreaView.
 */
export function BlurBackground({
  circles,
  blurAmount = 80,
  androidOverlayOpacity = '60',
}: BlurBackgroundProps) {
  const { colors } = useTheme();

  const defaultCircles: BlurCircle[] = React.useMemo(
    () => [
      { top: -100, left: -80, width: 360, height: 360, color: colors.primary + '70' },
      { top: 220, right: -140, width: 460, height: 460, color: colors.primary + '40' },
      { bottom: -80, left: -60, width: 300, height: 300, color: colors.secondary + '50' },
    ],
    [colors.primary, colors.secondary],
  );

  const resolvedCircles = circles ?? defaultCircles;

  return (
    <>
      {resolvedCircles.length > 0 && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {resolvedCircles.map((circle, index) => (
            <View
              key={index}
              style={[
                styles.circle,
                {
                  top: circle.top,
                  bottom: circle.bottom,
                  left: circle.left,
                  right: circle.right,
                  width: circle.width,
                  height: circle.height,
                  backgroundColor: circle.color,
                },
              ]}
            />
          ))}
        </View>
      )}

      <FrostLayer intensity={blurAmount} />

      {Platform.OS === 'android' && (
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background + androidOverlayOpacity }]}
          pointerEvents="none"
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    borderRadius: 999,
  },
});
