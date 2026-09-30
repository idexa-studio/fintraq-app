import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { MoneyText, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { sumByCurrency } from '@/src/utils/transactions';

type TransactionDayHeaderProps = {
  title: string;
  items: readonly { type: string; amount: number; account: { currency: string } }[];
};

/** Day label with that day's totals; mixed-currency days show a count instead of an ambiguous sum. */
export const TransactionDayHeader = React.memo(function TransactionDayHeader({ title, items }: TransactionDayHeaderProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const totals = useMemo(() => sumByCurrency(items), [items]);
  const currencies = Object.keys(totals);
  const single = currencies.length === 1 ? currencies[0] : null;

  return (
    <View style={styles.row}>
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.totals}>
        {single ? (
          <>
            {totals[single].income > 0 && <MoneyText amount={totals[single].income} currency={single} type="CR" weight="medium" style={styles.amount} />}
            {totals[single].expense > 0 && <MoneyText amount={totals[single].expense} currency={single} type="DR" weight="medium" style={styles.amount} />}
          </>
        ) : (
          <Text variant="caption" tone="muted">
            {t('transactions.dayCount', { count: items.length })}
          </Text>
        )}
      </View>
    </View>
  );
});

const createStyles = ({ spacing, typography }: ThemeContextType) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing('1'),
      marginBottom: spacing('3'),
    },
    // The date never wraps; totals shrink first.
    totals: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing('3'),
      marginLeft: spacing('3'),
    },
    amount: typography.metrics.sm,
  });
