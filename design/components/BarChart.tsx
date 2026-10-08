import { Text } from '@/design/components/Text';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type Bar = {
  label: string;
  value: number;
};

export type BarChartProps = {
  bars: Bar[];
  /** The bar to pick out in green: today, the peak, or the one selected. */
  highlight?: number;
  height?: number;
  /** One sentence that says what the chart shows, for screen readers. */
  accessibilityLabel: string;
};

// Worked out here, not inside the style: the animation library's checker takes any `.value` read in an inline style for an animated one.
const heightOf = (bar: { value: number }, max: number): `${number}%` => `${(bar.value / max) * 100}%`;

/** How much, across time or groups. Black bars, with one picked out in green. */
export function BarChart({ bars, highlight, height = 120, accessibilityLabel }: BarChartProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={styles.chart}>
      {bars.map((bar, i) => (
        <View key={`${bar.label}-${i}`} style={styles.column}>
          <View style={[styles.track, { height }]}>
            <View style={[styles.bar, { height: heightOf(bar, max), backgroundColor: i === highlight ? colors.accent : colors.text, borderColor: colors.text }]} />
          </View>
          <Text variant={i === highlight ? 'tabActive' : 'tab'} tone={i === highlight ? 'default' : 'muted'} numberOfLines={1}>{bar.label}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = ({ space, radius, border }: Theme) =>
  StyleSheet.create({
    chart: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
    column: { flex: 1, alignItems: 'center', gap: space.sm },
    track: { alignSelf: 'stretch', justifyContent: 'flex-end' },
    // An empty bar still shows as a sliver, so a zero day reads as zero and not as missing.
    // Every bar is outlined in the text colour, so the green one keeps its shape on a white card.
    bar: { minHeight: space.xxs, borderTopLeftRadius: radius.sm / 2, borderTopRightRadius: radius.sm / 2, borderWidth: border.thin },
  });
