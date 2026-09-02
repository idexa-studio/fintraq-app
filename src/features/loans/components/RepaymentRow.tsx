import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MoneyText } from '../../../components/ui/MoneyText';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import type { LoanRepaymentRow } from '../api/loans';
import type { LoanType } from '../api/loans';
import { format } from 'date-fns';

type Props = {
  row: LoanRepaymentRow;
  loanType: LoanType;
  isFirst?: boolean;
  isLast?: boolean;
  isCreation?: boolean;
};

export const RepaymentRow = React.memo(function RepaymentRow({ row, loanType, isFirst, isLast, isCreation }: Props) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const borderRadius = useMemo(() => ({
    borderTopLeftRadius: isFirst ? theme.radius('xl') : theme.radius('xs'),
    borderTopRightRadius: isFirst ? theme.radius('xl') : theme.radius('xs'),
    borderBottomLeftRadius: isLast ? theme.radius('xl') : theme.radius('xs'),
    borderBottomRightRadius: isLast ? theme.radius('xl') : theme.radius('xs'),
  }), [isFirst, isLast, theme]);

  const label = useMemo(() => {
    if (isCreation) return loanType === 'lend' ? 'Loan given' : 'Loan received';
    return loanType === 'lend' ? 'Repayment received' : 'Repayment sent';
  }, [isCreation, loanType]);

  const dateLabel = useMemo(() => {
    try { return format(new Date(row.datetime), 'MMM d, yyyy'); } catch { return row.datetime; }
  }, [row.datetime]);

  return (
    <View style={[styles.row, borderRadius]}>
      <View style={styles.dot}>
        <View style={[styles.dotInner, {
          backgroundColor: isCreation ? colors.textMuted : (loanType === 'lend' ? colors.success : colors.danger),
        }]} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>
          {row.note || label}
        </Text>
        <Text style={styles.sub}>
          {dateLabel} · {row.accountName}
        </Text>
      </View>
      <MoneyText
        amount={row.amount}
        currency={row.accountCurrency}
        type={isCreation ? (loanType === 'lend' ? 'DR' : 'CR') : (loanType === 'lend' ? 'CR' : 'DR')}
        weight="semibold"
        compact
        style={styles.amount}
      />
    </View>
  );
});

const createStyles = ({ colors, spacing, typography }: ThemeContextType) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
      marginBottom: spacing('1'),
      gap: spacing('3'),
    },
    dot: { width: 20, alignItems: 'center', justifyContent: 'center' },
    dotInner: { width: 8, height: 8, borderRadius: 4 },
    content: { flex: 1 },
    label: {
      fontSize: typography.sizes.md,
      fontFamily: typography.styles.rowLabel.fontFamily,
      color: colors.text,
    },
    sub: {
      fontSize: typography.sizes.xs,
      fontFamily: typography.styles.rowMeta.fontFamily,
      color: colors.textMuted,
      marginTop: spacing('0.5'),
    },
    amount: {
      fontSize: typography.sizes.md,
    },
  });
