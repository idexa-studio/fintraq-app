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
  const [box, setBox] = useState({ width: 0, height: 0 });
  // A measured size is often a fraction of a point. The drawing surface is cut to whole pixels,
  // so a shape drawn to the fraction loses its last line (the bottom edge of a chip). Drawing to
  // the whole points inside the box keeps every edge on the surface.
  const width = Math.floor(box.width);
  const height = Math.floor(box.height);
  // The line is centred on its path, so the path sits half a line inside the edge.
  const inset = stroke ? strokeWidth / 2 : 0;
  return (
    <View style={style} onLayout={(e) => { const { width: w, height: h } = e.nativeEvent.layout; setBox((current) => (current.width === w && current.height === h ? current : { width: w, height: h })); }}>
      {width > 0 && height > 0 ? (
        <Svg width={width} height={height} style={styles.shape} pointerEvents="none">
          <Path d={squirclePath(width, height, radius, inset)} fill={fill ?? 'none'} stroke={stroke} strokeWidth={stroke ? strokeWidth : 0} />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // Pinned to the top-left corner at its own whole-point size, not stretched to the box.
  shape: { position: 'absolute', top: 0, left: 0 },
});
