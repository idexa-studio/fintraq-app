import { Text } from '@/src/components/ui/Text';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { Icon } from '@/src/components/ui/Icon';
import { CurrencyPickerTab } from '@/src/features/dashboard/components/CurrencyPickerTab';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type Props = {
  income: number;
  expense: number;
  currency: string | null;
  currencies: string[];
  onCurrencySelect: (currency: string) => void;
  label?: string;
};

export const TransactionSummaryCard = React.memo(function TransactionSummaryCard({
  income,
  expense,
  currency,
  currencies,
  onCurrencySelect,
  label,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { heroCard } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const cur = currency ?? undefined;
  const net = income - expense;
  const isPositive = net >= 0;

  return (
    <View style={[styles.card, { backgroundColor: heroCard.background }]}>
      {/* Same decorative ring as the dashboard hero, so the two lime cards read as one family. */}
      <View style={[styles.ring, { borderColor: heroCard.decoOverlay }]} pointerEvents="none" />
      <Text variant="caption" color={heroCard.textMuted} style={styles.label}>
        {label ?? t('transactions.netSavings')}
      </Text>

      <MoneyText
        amount={Math.abs(net)}
        currency={cur}
        type={isPositive ? 'CR' : 'DR'}
        weight="bold"
        style={[styles.netAmount, { color: heroCard.textPrimary }]}
      />

      <View style={styles.stats}>
        <View style={[styles.statTile, { backgroundColor: heroCard.separator }]}>
          <View style={styles.statHeader}>
            <Icon icon={ArrowUp01Icon} size={13} color={heroCard.income} />
            <Text variant="caption" color={heroCard.textMuted}>{t('transactions.income')}</Text>
          </View>
          <MoneyText
            amount={income}
            currency={cur}
            type="CR"
            weight="semibold"
            style={[styles.statValue, { color: heroCard.textPrimary }]}
          />
        </View>

        <View style={[styles.statTile, { backgroundColor: heroCard.separator }]}>
          <View style={styles.statHeader}>
            <Icon icon={ArrowDown01Icon} size={13} color={heroCard.expense} />
            <Text variant="caption" color={heroCard.textMuted}>{t('transactions.expenses')}</Text>
          </View>
          <MoneyText
            amount={expense}
            currency={cur}
            type="DR"
            weight="semibold"
            style={[styles.statValue, { color: heroCard.textPrimary }]}
          />
        </View>
      </View>

      <CurrencyPickerTab
        currencies={currencies}
        selectedCurrency={currency ?? ''}
        onCurrencySelect={onCurrencySelect}
        heroCard={heroCard}
      />
    </View>
  );
});

const RING = 200;

const createStyles = ({ spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      borderRadius: radius('2xl'),
      padding: spacing('4'),
      paddingBottom: spacing('3'),
      overflow: 'hidden',
    },
    ring: { position: 'absolute', width: RING, height: RING, borderRadius: radius('full'), borderWidth: 26, top: -RING * 0.5, right: -RING * 0.3 },
    label: { marginBottom: spacing('1') },
    netAmount: {
      ...typography.metrics.display,
      marginBottom: spacing('4'),
    },
    stats: {
      flexDirection: 'row',
      gap: spacing('3'),
    },
    statTile: {
      flex: 1,
      borderRadius: radius('md'),
      paddingVertical: spacing('2.5'),
      paddingHorizontal: spacing('3'),
      gap: spacing('0.5'),
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
    },
    statValue: {
      ...typography.metrics.lg,
    },
  });
