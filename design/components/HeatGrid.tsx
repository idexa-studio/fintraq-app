import { Text } from '@/design/components/Text';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type HeatGridProps = {
  /** One value per cell, 0 to 1, in reading order. */
  values: number[];
  /** Cells per row, and the label above each column. */
  columns: string[];
  /** The cell to pick out in green, e.g. today. */
  highlight?: number;
  accessibilityLabel: string;
};

const LEVELS = [0, 0.18, 0.4, 0.7, 1];

/** A calendar of squares, darker where more happened: the rhythm of a month at a glance. */
export function HeatGrid({ values, columns, highlight, accessibilityLabel }: HeatGridProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const rows: number[][] = [];
  for (let i = 0; i < values.length; i += columns.length) rows.push(values.slice(i, i + columns.length));

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={styles.grid}>
      <View style={styles.row}>
        {columns.map((label, i) => <Text key={`${label}-${i}`} variant="tab" tone="muted" align="center" style={styles.cellLabel}>{label}</Text>)}
      </View>
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {columns.map((_, c) => {
            const index = r * columns.length + c;
            const value = row[c];
            if (value === undefined) return <View key={c} style={styles.blank} />;
            // Five steps read more clearly than a continuous fade.
            const level = LEVELS[Math.min(LEVELS.length - 1, Math.ceil(Math.min(1, Math.max(0, value)) * (LEVELS.length - 1)))];
            return (
              <View key={c} style={[styles.cell, { backgroundColor: colors.divider }, index === highlight ? { borderWidth: styles.mark.borderWidth, borderColor: colors.text } : null]}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: index === highlight ? colors.accent : colors.text, opacity: index === highlight ? 1 : level }]} />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const createStyles = ({ space, radius, border }: Theme) =>
  StyleSheet.create({
    grid: { gap: space.xs + space.xxs },
    row: { flexDirection: 'row', gap: space.xs + space.xxs },
    cellLabel: { flex: 1 },
    cell: { flex: 1, aspectRatio: 1, borderRadius: radius.sm / 2, overflow: 'hidden' },
    blank: { flex: 1 },
    mark: { borderWidth: border.thick },
  });
