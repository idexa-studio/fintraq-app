import { LIGHT_COLORS } from '@/design/tokens/colors';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * The launch screen's ground: the brand green, a deep green sweeping in from the top right and a
 * bright swell rolling along the foot. They are the wave card's own two waves, set for a tall
 * screen, so the launch screen and the card are one picture; the three greens are the reference's,
 * the shapes are Fintraq's. It fills whatever holds it and is the same in both schemes. Its ground
 * is the colour of the phone's own splash, so nothing flashes before the waves are drawn.
 */
export function WaveField() {
  // Drawn in the measured size: a stretched viewBox is not honoured the same way on every platform.
  const [{ w, h }, setBox] = useState({ w: 0, h: 0 });
  const p = (x: number, y: number) => `${(x * w).toFixed(1)} ${(y * h).toFixed(1)}`;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: LIGHT_COLORS.brand }]} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {w > 0 ? (
        <Svg width={w} height={h}>
          <Path d={`M${p(0.26, 0)} C${p(0.5, 0.17)} ${p(0.78, 0.06)} ${p(1, 0.27)} L${p(1, 0)} Z`} fill={LIGHT_COLORS.brandDeep} />
          <Path d={`M${p(0, 1)} L${p(0, 0.84)} C${p(0.16, 0.75)} ${p(0.3, 0.91)} ${p(0.48, 0.84)} C${p(0.68, 0.76)} ${p(0.82, 0.85)} ${p(1, 0.7)} L${p(1, 1)} Z`} fill={LIGHT_COLORS.brandBright} />
        </Svg>
      ) : null}
    </View>
  );
}
