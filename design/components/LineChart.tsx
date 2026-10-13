import { Text } from '@/design/components/Text';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

export type LinePoint = {
  label: string;
  value: number;
};

export type LineChartProps = {
  points: LinePoint[];
  height?: number;
  /** How many of the labels to print under the line, evenly spread. */
  labels?: number;
  /** One sentence that says what the chart shows, for screen readers. */
  accessibilityLabel: string;
};

const PAD = 6;

/** A figure over time: a black line that ends in a green dot, with a baseline at zero when the range crosses it. */
export function LineChart({ points, height = 140, labels = 4, accessibilityLabel }: LineChartProps) {
  const { colors, border } = useTheme();
  const styles = useStyles(createStyles);
  const [width, setWidth] = useState(0);
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => PAD + (i / Math.max(1, points.length - 1)) * (width - PAD * 2);
  const y = (value: number) => PAD + (1 - (value - min) / span) * (height - PAD * 2);
  const last = points.length - 1;
  const shown = points.length <= labels ? points.map((_, i) => i) : Array.from({ length: labels }, (_, i) => Math.round((i * last) / (labels - 1)));

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={styles.wrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && points.length > 1 ? (
        <Svg width={width} height={height}>
          {min < 0 && max > 0 ? <Line x1={0} x2={width} y1={y(0)} y2={y(0)} stroke={colors.divider} strokeWidth={border.thin} /> : null}
          <Polyline points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')} fill="none" stroke={colors.text} strokeWidth={border.thick} strokeLinejoin="round" strokeLinecap="round" />
          <Circle cx={x(last)} cy={y(points[last].value)} r={PAD - 1} fill={colors.accent} stroke={colors.text} strokeWidth={border.thick} />
        </Svg>
      ) : <View style={{ height }} />}
      <View style={styles.labels}>
        {shown.map((i) => <Text key={i} variant="tab" tone="muted">{points[i].label}</Text>)}
      </View>
    </View>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    wrap: { gap: space.sm },
    labels: { flexDirection: 'row', justifyContent: 'space-between' },
  });
