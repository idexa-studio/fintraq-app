import { Text } from '@/src/components/ui/Text';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { Icon } from '@/src/components/ui/Icon';
import { StreakBadge } from '@/src/features/reports/components/StreakBadge';
import { HeroCardPalette, ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { CurrencyPickerTab } from './CurrencyPickerTab';

type Props = {
  balance: number;
  currency: string;
  income: number;
  expense: number;
  currencies?: string[];
  onCurrencySelect?: (currency: string) => void;
};

export const HeroBalanceCard = React.memo(function HeroBalanceCard({ balance, currency, income, expense, currencies, onCurrencySelect }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { heroCard } = theme;
  const styles = useMemo(() => createStyles(theme, heroCard), [theme, heroCard]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text variant="caption" color={heroCard.textMuted}>{t('dashboard.balance')}</Text>
        <StreakBadge heroCard={heroCard} />
      </View>

      {/* Shrinks rather than wraps or clips when the balance runs long. */}
      <MoneyText
        amount={balance}
        currency={currency}
        style={styles.balance}
        weight="bold"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      />

      <View style={styles.stats}>
        {([
          { key: 'income', icon: ArrowUp01Icon, color: heroCard.income, amount: income, type: 'CR' },
          { key: 'expenses', icon: ArrowDown01Icon, color: heroCard.expense, amount: expense, type: 'DR' },
        ] as const).map((stat) => (
          <View key={stat.key} style={styles.stat}>
            <View style={styles.statHeader}>
              <Icon icon={stat.icon} size={14} color={stat.color} weight="bold" />
              <Text variant="caption" color={heroCard.textMuted}>{t(`dashboard.${stat.key}`)}</Text>
            </View>
            <MoneyText
              amount={stat.amount}
              currency={currency}
              type={stat.type}
              weight="semibold"
              style={styles.statValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            />
          </View>
        ))}
      </View>

      <CurrencyPickerTab
        currencies={currencies || []}
        selectedCurrency={currency}
        onCurrencySelect={onCurrencySelect}
        heroCard={heroCard}
      />
    </View>
  );
});

const createStyles = ({ spacing, radius, layout, typography }: ThemeContextType, heroCard: HeroCardPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: heroCard.background,
      marginHorizontal: layout.screenPadding,
      borderRadius: radius('2xl'),
      padding: spacing('5'),
      gap: spacing('4'),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 24,
      marginBottom: -spacing('3'),
    },
    balance: {
      ...typography.metrics.display,
      color: heroCard.textPrimary,
    },
    stats: {
      flexDirection: 'row',
      gap: spacing('2.5'),
    },
    stat: {
      flex: 1,
      backgroundColor: heroCard.separator,
      paddingVertical: spacing('2.5'),
      paddingHorizontal: spacing('3'),
      borderRadius: radius('lg'),
      gap: spacing('1'),
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
    },
    statValue: {
      ...typography.metrics.md,
      color: heroCard.textPrimary,
    },
  });
