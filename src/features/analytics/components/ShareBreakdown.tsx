import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { BentoPressable, MoneyText, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { TransactionType } from '@/src/types';

export type ShareItem = {
  key: string;
  name: string;
  amount: number;
  currency: string;
  /** 0–1 */
  share: number;
  color: string;
  leading: React.ReactNode;
  type?: TransactionType | 'NONE';
  onPress?: () => void;
};

type ShareBreakdownProps = { items: readonly ShareItem[] };

/** Proportion bar plus a two-column grid of the parts — categories, people or accounts. */
export const ShareBreakdown = React.memo(function ShareBreakdown({ items }: ShareBreakdownProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const cellWidth = (width - theme.layout.screenPadding * 2 - theme.spacing('2')) / 2;

  return (
    <View style={styles.section}>
      <View style={styles.bar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {items.map((item) => (
          <View key={item.key} style={[styles.segment, { flex: item.share, backgroundColor: item.color }]} />
        ))}
      </View>
      <View style={styles.grid}>
        {items.map((item) => {
          const percent = `${Math.round(item.share * 100)}%`;
          const body = (
            <>
              {item.leading}
              <View style={styles.cellBody}>
                <Text variant="label" numberOfLines={1}>
                  {item.name}
                </Text>
                <MoneyText amount={item.amount} currency={item.currency} type={item.type ?? 'NONE'} compact style={styles.amount} />
              </View>
              <Text variant="micro" tone="muted" style={styles.percent}>
                {percent}
              </Text>
            </>
          );
          const cellStyle = [styles.cell, { width: cellWidth }];
          return item.onPress ? (
            <BentoPressable
              key={item.key}
              style={cellStyle}
              onPress={item.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${percent}`}
            >
              {body}
            </BentoPressable>
          ) : (
            <View key={item.key} style={cellStyle} accessible accessibilityLabel={`${item.name}, ${percent}`}>
              {body}
            </View>
          );
        })}
      </View>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    section: { gap: spacing('3') },
    bar: { flexDirection: 'row', height: spacing('2.5'), borderRadius: radius('full'), overflow: 'hidden', gap: 2 },
    segment: { borderRadius: radius('full') },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('2') },
    cell: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      padding: spacing('3'),
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
    },
    cellBody: { flex: 1 },
    amount: typography.metrics.xs,
    percent: { position: 'absolute', top: spacing('3'), right: spacing('3') },
  });
