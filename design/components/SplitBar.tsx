import { Text } from '@/design/components/Text';
import { useStyles } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type SplitSegment = {
  label: string;
  /** Sets the width of the segment. */
  value: number;
  /** Shown in the legend, already formatted. */
  display: string;
  color: string;
};

export type SplitBarProps = {
  segments: SplitSegment[];
};

// Worked out here, not inside the style: the animation library's checker takes any `.value` read in an inline style for an animated one.
const shareOf = (segment: { value: number }): number => segment.value;

/** One bar cut into parts of a whole, with a legend under it. */
export function SplitBar({ segments }: SplitBarProps) {
  const styles = useStyles(createStyles);
  const shown = segments.filter((s) => s.value > 0);
  return (
    <View style={styles.wrap} accessible accessibilityLabel={segments.map((s) => `${s.label} ${s.display}`).join(', ')}>
      <View style={styles.bar}>
        {shown.map((segment) => <View key={segment.label} style={[styles.segment, { flex: shareOf(segment), backgroundColor: segment.color }]} />)}
      </View>
      <View style={styles.legend}>
        {segments.map((segment) => (
          <View key={segment.label} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: segment.color }]} />
            <View>
              <Text variant="caption" tone="muted">{segment.label}</Text>
              <Text variant="calloutStrong">{segment.display}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = ({ space, radius }: Theme) =>
  StyleSheet.create({
    wrap: { gap: space.md },
    bar: { flexDirection: 'row', height: space.lg, gap: space.xxs, borderRadius: radius.sm / 2, overflow: 'hidden' },
    segment: { height: '100%' },
    legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.xl, rowGap: space.sm },
    item: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
    dot: { width: space.sm + space.xxs, height: space.sm + space.xxs, borderRadius: space.sm, marginTop: space.xs },
  });
