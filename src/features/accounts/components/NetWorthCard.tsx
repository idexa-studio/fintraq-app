import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { HeroSurface, MoneyText, Text } from '@/src/components/ui';
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
 * Net worth for one currency on the hero surface, like Home and Transactions: the figure, an
 * allocation bar (largest account first, so the list below reads as parts of this whole),
 * and what is owned against what is owed.
 */
export const NetWorthCard = React.memo(function NetWorthCard({ group, currencies, netByCurrency, onCurrencySelect }: Props) {
  const theme = useTheme();
  const { heroCard: hero } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const holdings = group.accounts.filter((a) => a.balance > 0);

  const side = (label: string, amount: number, dot: string, end?: boolean) => (
    <View style={[styles.side, end && styles.sideEnd]}>
      <View style={styles.sideLabel}>
        <View style={[styles.dot, { backgroundColor: dot }]} />
        <Text variant="caption" color={hero.textMuted}>
          {label}
        </Text>
      </View>
      <MoneyText amount={amount} currency={group.currency} weight="semibold" style={styles.sideValue} numberOfLines={1} />
    </View>
  );

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

      <View style={styles.flow}>
        {holdings.length > 0 ? (
          <View style={styles.bar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {/* One ink, fading by rank: account colours can match the hero and vanish into it. */}
            {holdings.map((a, i) => (
              <View key={a.id} style={[styles.segment, { flex: a.balance, opacity: Math.max(0.25, 0.9 - i * 0.2) }]} />
            ))}
          </View>
        ) : null}
        <View style={styles.sides}>
          {side(t('accounts.assets'), group.assets, hero.income)}
          {side(t('accounts.debts'), group.debts, hero.expense, true)}
        </View>
      </View>
    </HeroSurface>
  );
});

const createStyles = ({ heroCard: hero, spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing('3'), minHeight: 30 },
    headerLeft: { gap: 2, flexShrink: 1 },
    net: { ...typography.metrics.display, color: hero.textPrimary, marginTop: -spacing('2') },
    flow: { gap: spacing('3') },
    bar: { flexDirection: 'row', height: 6, gap: 3 },
    segment: { borderRadius: radius('full'), backgroundColor: hero.textPrimary },
    sides: { flexDirection: 'row', gap: spacing('4') },
    side: { flex: 1, gap: spacing('0.5') },
    sideEnd: { alignItems: 'flex-end' },
    sideLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing('1.5') },
    dot: { width: 8, height: 8, borderRadius: radius('full') },
    sideValue: { ...typography.metrics.lg, color: hero.textPrimary },
  });
