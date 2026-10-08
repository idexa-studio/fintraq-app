import { LIGHT_COLORS } from '@/design/tokens/colors';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * The reference's launch screen as a ground: deep green above, the brand green across the middle,
 * and a bright wave breaking at the foot. It fills whatever holds it and is the same in both
 * schemes. The curves were traced from the reference at its own proportions. Its ground is the
 * brand green, the colour of the phone's own splash, so nothing flashes before the waves are drawn.
 */
export function WaveField() {
  // Drawn in the measured size: a stretched viewBox is not honoured the same way on every platform.
  const [{ w, h }, setBox] = useState({ w: 0, h: 0 });
  const p = (x: number, y: number) => `${(x * w).toFixed(1)} ${(y * h).toFixed(1)}`;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: LIGHT_COLORS.brand }]} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {w > 0 ? (
        <Svg width={w} height={h}>
          <Path d={`M${p(0, 0)} L${p(1, 0)} L${p(1, 0.228)} C${p(0.93, 0.219)} ${p(0.847, 0.214)} ${p(0.75, 0.213)} C${p(0.458, 0.212)} ${p(0.208, 0.269)} ${p(0, 0.333)} Z`} fill={LIGHT_COLORS.brandDeep} />
          <Path
            d={`M${p(0, 0.678)} C${p(0.083, 0.66)} ${p(0.167, 0.647)} ${p(0.254, 0.641)} C${p(0.132, 0.686)} ${p(0.118, 0.782)} ${p(0.257, 0.827)} C${p(0.319, 0.763)} ${p(0.472, 0.734)} ${p(0.625, 0.737)} C${p(0.833, 0.744)} ${p(0.958, 0.833)} ${p(0.944, 0.929)} C${p(0.942, 0.962)} ${p(0.933, 0.984)} ${p(0.924, 1)} L${p(0, 1)} Z`}
            fill={LIGHT_COLORS.brandBright}
          />
        </Svg>
      ) : null}
    </View>
  );
}
