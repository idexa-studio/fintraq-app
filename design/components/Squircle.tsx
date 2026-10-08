import { squirclePath } from '@/design/components/squircle-path';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type SquircleProps = {
  radius: number;
  /** The colour inside. Leave out for an outline only. */
  fill?: string;
  /** The colour of the outline, drawn inside the shape's edge. */
  stroke?: string;
  strokeWidth?: number;
  /** Layout of the box the shape fills: its size, padding and how its children sit. */
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * A box with smooth corners, drawn the same on both platforms. A plain
 * rounded corner is an arc joined to a straight edge; this eases into the
 * curve, as the reference's chips do. The shape is drawn behind the children
 * once the box has been measured.
 */
export function Squircle({ radius, fill, stroke, strokeWidth = 0, style, children }: SquircleProps) {
  const [{ width, height }, setBox] = useState({ width: 0, height: 0 });
  // The line is centred on its path, so the path sits half a line inside the edge.
  const inset = stroke ? strokeWidth / 2 : 0;
  return (
    <View style={style} onLayout={(e) => { const { width: w, height: h } = e.nativeEvent.layout; setBox((box) => (box.width === w && box.height === h ? box : { width: w, height: h })); }}>
      {width > 0 && height > 0 ? (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Path d={squirclePath(width, height, radius, inset)} fill={fill ?? 'none'} stroke={stroke} strokeWidth={stroke ? strokeWidth : 0} />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}
