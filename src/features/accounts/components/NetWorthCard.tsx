import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { HeroSplit, HeroSurface, MoneyText, Text } from '@/src/components/ui';
import type { CurrencyNetWorth } from '@/src/features/accounts/utils/net-worth';
import { CurrencySwitcher } from '@/src/features/dashboard/components/CurrencySwitcher';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  group: CurrencyNetWorth;
  currencies: string[];
  /** Net worth per currency, listed in the currency sheet. */
  netByCurrency: Record<string, number>;
  onCurrencySelect: (currency: string) => void;
};

/**
 * Net worth for one currency on the hero surface, like Home and Transactions: the figure, then
 * what is owned weighed against what is owed.
 */
export const NetWorthCard = React.memo(function NetWorthCard({ group, currencies, netByCurrency, onCurrencySelect }: Props) {
  const theme = useTheme();
  const { heroCard: hero } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <HeroSurface>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="caption" color={hero.textMuted}>
            {t('accounts.netWorth')}
          </Text>
          <Text variant="micro" color={hero.textMuted}>
            {group.accounts.length === 1 ? t('transactions.oneAccount') : t('transactions.accountsCount', { count: group.accounts.length })}
          </Text>
        </View>
        <CurrencySwitcher currencies={currencies} selected={group.currency} onSelect={onCurrencySelect} amounts={netByCurrency} />
      </View>

      <MoneyText
        amount={group.net}
        currency={group.currency}
        weight="bold"
        style={styles.net}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.55}
      />

      <HeroSplit
        primary={{ label: t('accounts.assets'), amount: group.assets }}
        secondary={{ label: t('accounts.debts'), amount: group.debts }}
        currency={group.currency}
      />
    </HeroSurface>
  );
});

const createStyles = ({ heroCard: hero, spacing, typography }: ThemeContextType) =>
  StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing('3'), minHeight: 32 },
    headerLeft: { gap: 2, flexShrink: 1 },
    net: { ...typography.metrics.display, color: hero.textPrimary, marginTop: -spacing('2') },
  });
