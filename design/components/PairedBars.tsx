import { Text } from '@/design/components/Text';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type BarPair = {
  label: string;
  /** The first series, e.g. money in. */
  first: number;
  /** The second series, e.g. money out. */
  second: number;
};

export type PairedBarsProps = {
  pairs: BarPair[];
  /** Names of the two series, for the legend. */
  firstLabel: string;
  secondLabel: string;
  height?: number;
  /** One sentence that says what the chart shows, for screen readers. */
  accessibilityLabel: string;
};

/** Two figures side by side for each period: money in (green) against money out (black), month by month. */
export function PairedBars({ pairs, firstLabel, secondLabel, height = 120, accessibilityLabel }: PairedBarsProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const max = Math.max(...pairs.flatMap((p) => [p.first, p.second]), 1);
  const share = (value: number) => `${(value / max) * 100}%` as const;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={styles.wrap}>
      <View style={styles.legend}>
        <View style={styles.key}><View style={[styles.swatch, styles.outlined, { backgroundColor: colors.accent }]} /><Text variant="caption" tone="muted">{firstLabel}</Text></View>
        <View style={styles.key}><View style={[styles.swatch, { backgroundColor: colors.text }]} /><Text variant="caption" tone="muted">{secondLabel}</Text></View>
      </View>
      <View style={styles.chart}>
        {pairs.map((pair, i) => (
          <View key={`${pair.label}-${i}`} style={styles.column}>
            <View style={[styles.bars, { height }]}>
              {/* The green carries an outline: on white it is too light to read alone. */}
              <View style={[styles.bar, styles.outlined, { height: share(pair.first), backgroundColor: colors.accent }]} />
              <View style={[styles.bar, { height: share(pair.second), backgroundColor: colors.text }]} />
            </View>
            <Text variant="tab" tone="muted" numberOfLines={1}>{pair.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = ({ colors, space, radius, border }: Theme) =>
  StyleSheet.create({
    wrap: { gap: space.md },
    legend: { flexDirection: 'row', gap: space.lg },
    key: { flexDirection: 'row', alignItems: 'center', gap: space.xs + space.xxs },
    swatch: { width: space.md, height: space.md, borderRadius: radius.sm / 2 },
    outlined: { borderWidth: border.thin, borderColor: colors.text },
    chart: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
    column: { flex: 1, alignItems: 'center', gap: space.sm },
    bars: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: space.xxs },
    bar: { flex: 1, maxWidth: space.md + space.xxs, minHeight: space.xxs, borderTopLeftRadius: radius.sm / 2, borderTopRightRadius: radius.sm / 2 },
  });
