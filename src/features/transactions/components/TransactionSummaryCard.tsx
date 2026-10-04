import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { HeroSplit, HeroSurface, MoneyText, Text } from '@/src/components/ui';
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
 * Net for the listed transactions in one currency, with income weighed against expense below. Amounts shrink to fit instead of overflowing — rupee and yen totals run long — and the
 * currency switch is a single chip, so any number of currencies fits.
 */
export const TransactionSummaryCard = React.memo(function TransactionSummaryCard({ income, expense, currency, currencies, onCurrencySelect, netByCurrency, label }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { heroCard: hero } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const cur = currency ?? undefined;
  const net = income - expense;

  return (
    <HeroSurface>
      <View style={styles.header}>
        <Text variant="caption" color={hero.textMuted} numberOfLines={1} style={styles.label}>
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

      <HeroSplit
        primary={{ label: t('transactions.income'), amount: income }}
        secondary={{ label: t('transactions.expenses'), amount: expense }}
        currency={cur}
      />
    </HeroSurface>
  );
});

const createStyles = ({ heroCard: hero, spacing, typography }: ThemeContextType) =>
  StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing('3'), minHeight: 32 },
    label: { flexShrink: 1 },
    // The sign carries direction; the figure itself stays in hero ink.
    net: { ...typography.metrics.display, color: hero.textPrimary, marginTop: -spacing('2') },
  });
