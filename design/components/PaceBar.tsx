import { Text } from '@/design/components/Text';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type PaceBarProps = {
  /** Spent so far, as a share of the reference amount (a budget, or last month's total). 0 to 1 and beyond. */
  spent: number;
  /** Where spending will end at the current pace, on the same scale. */
  projected: number;
  /** How far through the period today is, 0 to 1. */
  today: number;
  /** Labels for the two ends of the track and for the today mark. */
  startLabel: string;
  endLabel: string;
  todayLabel: string;
  accessibilityLabel: string;
};

/**
 * A forecast on one line: solid for what is spent, striped on to where it is
 * heading, and a mark for today. If the stripe passes the end of the track,
 * the period will finish over.
 */
export function PaceBar({ spent, projected, today, startLabel, endLabel, todayLabel, accessibilityLabel }: PaceBarProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  // The track stands for the reference amount; anything past it is drawn in the last tenth, in red.
  const scale = Math.max(1, projected) * 1.0;
  const pct = (v: number) => `${Math.min(100, Math.max(0, (v / scale) * 100))}%` as const;
  const over = projected > 1;
  return (
    <View style={styles.wrap} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <View style={styles.markRow}>
        <View style={[styles.markLabel, { left: pct(today * Math.min(1, scale)) }]}>
          <Text variant="tabActive">{todayLabel}</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: pct(projected), backgroundColor: over ? colors.danger : colors.textMuted, opacity: 0.45 }]} />
        <View style={[styles.fill, { width: pct(spent), backgroundColor: colors.text }]} />
        {over ? <View style={[styles.limit, { left: pct(1), backgroundColor: colors.surface }]} /> : null}
        <View style={[styles.today, { left: pct(today * Math.min(1, scale)), backgroundColor: colors.selected }]} />
      </View>
      <View style={styles.ends}>
        <Text variant="tab" tone="muted">{startLabel}</Text>
        {/* The end label names the reference amount, so past it the label stays under the limit mark, not at the track's end. */}
        <View style={over ? [styles.endAtLimit, { width: pct(1) }] : null}>
          <Text variant="tab" tone="muted">{endLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = ({ colors, radius, space, border }: Theme) =>
  StyleSheet.create({
    wrap: { gap: space.xs },
    markRow: { height: space.lg },
    markLabel: { position: 'absolute', transform: [{ translateX: -space.lg }] },
    track: { height: space.md, borderRadius: radius.pill, backgroundColor: colors.divider, overflow: 'hidden' },
    fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: radius.pill },
    limit: { position: 'absolute', top: 0, bottom: 0, width: border.thick },
    today: { position: 'absolute', top: 0, bottom: 0, width: border.thick + 1 },
    ends: { flexDirection: 'row', justifyContent: 'space-between' },
    endAtLimit: { position: 'absolute', left: 0, top: 0, alignItems: 'flex-end' },
  });
