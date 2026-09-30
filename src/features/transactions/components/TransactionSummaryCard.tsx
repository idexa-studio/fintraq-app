import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { HeroSurface, MoneyText, Text } from '@/src/components/ui';
import { CurrencySwitcher } from '@/src/features/dashboard/components/CurrencySwitcher';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  income: number;
  expense: number;
  currency: string | null;
  currencies: string[];
  onCurrencySelect: (currency: string) => void;
  /** Net per currency, listed in the currency sheet. */
  netByCurrency?: Record<string, number>;
  label?: string;
};

/**
 * Net for the listed transactions in one currency, with income against expense drawn as a split
 * bar. Amounts shrink to fit instead of overflowing — rupee and yen totals run long — and the
 * currency switch is a single chip, so any number of currencies fits.
 */
export const TransactionSummaryCard = React.memo(function TransactionSummaryCard({ income, expense, currency, currencies, onCurrencySelect, netByCurrency, label }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const cur = currency ?? undefined;
  const net = income - expense;
  const flow = income + expense;
  // Share of money in; the rest of the bar is money out.
  const inShare = flow > 0 ? income / flow : 0.5;

  const side = (key: 'in' | 'out') => {
    const isIn = key === 'in';
    return (
      <View style={[styles.side, !isIn && styles.sideEnd]}>
        <View style={styles.sideLabel}>
          <View style={[styles.dot, { backgroundColor: isIn ? colors.onInkAccent : colors.danger }]} />
          <Text variant="caption" color={colors.onInkMuted} numberOfLines={1}>
            {isIn ? t('transactions.income') : t('transactions.expenses')}
          </Text>
        </View>
        <MoneyText
          amount={isIn ? income : expense}
          currency={cur}
          weight="semibold"
          style={styles.sideValue}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        />
      </View>
    );
  };

  return (
    <HeroSurface>
      <View style={styles.header}>
        <Text variant="caption" color={colors.onInkMuted} numberOfLines={1} style={styles.label}>
          {label ?? t('transactions.netSavings')}
        </Text>
        {currency ? <CurrencySwitcher currencies={currencies} selected={currency} onSelect={onCurrencySelect} amounts={netByCurrency} /> : null}
      </View>

      <MoneyText
        amount={Math.abs(net)}
        currency={cur}
        type={net >= 0 ? 'CR' : 'DR'}
        weight="bold"
        style={styles.net}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.55}
      />

      <View style={styles.flow}>
        <View style={styles.bar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.segment, { flex: inShare, backgroundColor: colors.onInkAccent }]} />
          <View style={[styles.segment, { flex: 1 - inShare, backgroundColor: colors.danger }]} />
        </View>
        <View style={styles.sides}>
          {side('in')}
          {side('out')}
        </View>
      </View>
    </HeroSurface>
  );
});

const createStyles = ({ colors, spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing('3'), minHeight: 30 },
    label: { flexShrink: 1 },
    // The sign carries direction; the figure itself stays white for weight on the ink card.
    net: { ...typography.metrics.display, color: colors.onInk, marginTop: -spacing('2') },
    flow: { gap: spacing('3') },
    bar: { flexDirection: 'row', height: 6, gap: 3 },
    segment: { borderRadius: radius('full') },
    sides: { flexDirection: 'row', gap: spacing('4') },
    side: { flex: 1, gap: spacing('0.5') },
    sideEnd: { alignItems: 'flex-end' },
    sideLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing('1.5') },
    dot: { width: 8, height: 8, borderRadius: radius('full') },
    sideValue: { ...typography.metrics.lg, color: colors.onInk },
  });
