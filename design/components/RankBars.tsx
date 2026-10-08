import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import { ltr } from '@/design/tokens/typography';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type RankItem = {
  key: string;
  label: string;
  /** Sets the bar's length against the largest item. */
  value: number;
  /** The figure, already formatted. */
  display: string;
  /** A second, quieter figure, e.g. "29%". */
  note?: string;
  /** A mark before the label, e.g. an IconCircle. */
  leading?: React.ReactNode;
  /** Where the item leads, e.g. the transactions behind the figure. */
  onPress?: () => void;
};

export type RankBarsProps = {
  /** Largest first; the component does not sort. */
  items: RankItem[];
};

/** A ranking: each item's bar is drawn against the biggest, so the eye compares lengths. For categories, people, accounts. */
export function RankBars({ items }: RankBarsProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const label = [item.label, item.display, item.note].filter(Boolean).join(', ');
        const content = (
          <>
            {item.leading}
            <View style={styles.body}>
              <View style={styles.head}>
                <Text variant="bodyStrong" numberOfLines={1} style={styles.label}>{item.label}</Text>
                {item.note ? <Text variant="callout" tone="muted">{item.note}</Text> : null}
                <Text variant="amount">{ltr(item.display)}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${Math.max(2, (item.value / max) * 100)}%`, backgroundColor: colors.text }]} />
              </View>
            </View>
          </>
        );
        return item.onPress ? (
          <Touchable key={item.key} onPress={item.onPress} accessibilityLabel={label} style={styles.item}>{content}</Touchable>
        ) : (
          <View key={item.key} style={styles.item} accessible accessibilityLabel={label}>{content}</View>
        );
      })}
    </View>
  );
}

const createStyles = ({ colors, radius, space }: Theme) =>
  StyleSheet.create({
    wrap: { gap: space.lg },
    item: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    body: { flex: 1, gap: space.sm },
    head: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
    label: { flex: 1 },
    track: { height: space.sm, borderRadius: radius.pill, backgroundColor: colors.divider, overflow: 'hidden' },
    bar: { height: '100%', borderRadius: radius.pill },
  });
