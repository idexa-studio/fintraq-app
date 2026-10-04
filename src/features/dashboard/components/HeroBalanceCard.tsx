import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { HeroSplit, HeroSurface, MoneyText, Text } from '@/src/components/ui';
import { CurrencySwitcher } from '@/src/features/dashboard/components/CurrencySwitcher';
import { StreakBadge } from '@/src/features/reports/components/StreakBadge';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  balance: number;
  currency: string;
  /** Everything ever earned and spent in `currency`. */
  income: number;
  expense: number;
  currencies: string[];
  onCurrencySelect: (currency: string) => void;
};

/** The balance, all-time money in and out, and the currency track — the original Home hero. */
export const HeroBalanceCard = React.memo(function HeroBalanceCard({ balance, currency, income, expense, currencies, onCurrencySelect }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { heroCard: hero } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <HeroSurface>
      <View style={styles.header}>
        <Text variant="caption" color={hero.textMuted}>
          {t('dashboard.balance')}
        </Text>
        <StreakBadge />
      </View>

      {/* Shrinks rather than wraps or clips when the balance runs long. */}
      <MoneyText amount={balance} currency={currency} style={styles.balance} weight="bold" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxChars={16} />

      <HeroSplit
        primary={{ label: t('transactions.income'), amount: income }}
        secondary={{ label: t('transactions.expenses'), amount: expense }}
        currency={currency}
      />

      <CurrencySwitcher currencies={currencies} selected={currency} onSelect={onCurrencySelect} />
    </HeroSurface>
  );
});

const createStyles = ({ heroCard: hero, spacing, typography }: ThemeContextType) =>
  StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 24, marginBottom: -spacing('3') },
    balance: { ...typography.metrics.display, color: hero.textPrimary },
  });
