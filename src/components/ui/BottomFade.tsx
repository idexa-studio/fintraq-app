import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/src/providers/ThemeProvider';

type BottomFadeProps = {
  /** Total height of the fade, measured from the bottom edge of the screen. */
  height: number;
};

/**
 * Dissolves scrolling content into the page colour at the bottom of a screen, so anything that
 * floats there (the tab bar) sits on a calm ground instead of over half-visible rows. A scrim,
 * not decoration: it is the page colour fading in, and it never intercepts touches.
 */
export const BottomFade = React.memo(function BottomFade({ height }: BottomFadeProps) {
  const { colors } = useTheme();
  return (
    <View pointerEvents="none" style={[styles.fade, { height }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.background} stopOpacity="0" />
            <Stop offset="0.45" stopColor={colors.background} stopOpacity="0.86" />
            <Stop offset="1" stopColor={colors.background} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bottomFade)" />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
