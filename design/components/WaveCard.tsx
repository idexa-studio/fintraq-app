import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type WaveCardProps = {
  /** Set text in black (`INK`): the card is green in both schemes. */
  children: React.ReactNode;
  accessibilityLabel?: string;
};

/**
 * The brand moment: three greens in overlapping waves, as on the launch
 * screen. For the single most important figure of a screen, at most once.
 */
export function WaveCard({ children, accessibilityLabel }: WaveCardProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  // The waves are drawn in the card's own measured size: a stretched viewBox
  // is not honoured the same way on every platform.
  const [{ w, h }, setBox] = useState({ w: 0, h: 0 });
  const x = (share: number) => (share * w).toFixed(1);
  const y = (share: number) => (share * h).toFixed(1);
  return (
    <View
      style={styles.card}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {w > 0 ? (
        <Svg style={StyleSheet.absoluteFill} width={w} height={h}>
          <Path d={`M${x(0.47)} 0 C${x(0.64)} ${y(0.23)} ${x(0.83)} ${y(0.09)} ${w} ${y(0.39)} L${w} 0 Z`} fill={colors.brandDeep} />
          <Path d={`M0 ${h} L0 ${y(0.86)} C${x(0.14)} ${y(0.68)} ${x(0.27)} ${y(0.99)} ${x(0.44)} ${y(0.86)} C${x(0.64)} ${y(0.71)} ${x(0.79)} ${y(0.85)} ${w} ${y(0.6)} L${w} ${h} Z`} fill={colors.brandBright} />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

const createStyles = ({ colors, radius, size, space }: Theme) =>
  StyleSheet.create({
    card: { backgroundColor: colors.brand, borderRadius: radius.md, overflow: 'hidden', padding: size.cardPadding, paddingBottom: space.xxxl, gap: space.xs },
  });
