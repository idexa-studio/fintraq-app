import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { TransactionType } from '@/shared/types';
import { BentoPressable } from './BentoPressable';
import { MoneyText } from './MoneyText';
import { Text } from './Text';
import { TrendBadge } from './TrendBadge';

export type StatColumn = {
  key: string;
  label: string;
  amount?: number;
  currency?: string;
  type?: TransactionType | 'NONE';
  /** % change vs a previous period; renders a TrendBadge under the value. */
  delta?: number | null;
  positiveIsGood?: boolean;
  /** Replaces the value (e.g. a Pro lock). */
  content?: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
};

type Props = {
  columns: readonly StatColumn[];
  /** Hairline above the row — on when it sits under a headline figure in a card. */
  divided?: boolean;
};

/**
 * Secondary figures under a card's headline number, split by hairlines. The one layout for
 * "income | expense", "principal | repaid", "per day | projected" across the app.
 */
export const StatColumns = React.memo(function StatColumns({ columns, divided = true }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.row, divided && styles.divided]}>
      {columns.map((c, i) => {
        const body = (
          <>
            <Text variant="micro" tone="muted" numberOfLines={1}>
              {c.label}
            </Text>
            {c.content ?? (
              <MoneyText amount={c.amount ?? 0} currency={c.currency} type={c.type ?? 'NONE'} weight="semibold" compact style={styles.value} numberOfLines={1} />
            )}
            {c.delta !== undefined ? <TrendBadge delta={c.delta} positiveIsGood={c.positiveIsGood} /> : null}
          </>
        );
        const style = [styles.column, i > 0 && styles.columnDivider];
        return c.onPress ? (
          <BentoPressable key={c.key} style={style} onPress={c.onPress} accessibilityRole="button" accessibilityLabel={c.accessibilityLabel ?? c.label}>
            {body}
          </BentoPressable>
        ) : (
          <View key={c.key} style={style}>
            {body}
          </View>
        );
      })}
    </View>
  );
});

const createStyles = ({ colors, spacing, typography, alpha }: ThemeContextType) =>
  StyleSheet.create({
    row: { flexDirection: 'row' },
    divided: { paddingTop: spacing('3'), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: alpha(colors.text, 'subtle') },
    column: { flex: 1, gap: spacing('0.5') },
    columnDivider: { paddingLeft: spacing('3'), borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: alpha(colors.text, 'subtle') },
    value: typography.metrics.md,
  });
