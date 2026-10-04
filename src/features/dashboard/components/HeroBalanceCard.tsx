import React, { ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { HeroSurface, Icon, MoneyText, Text } from '@/src/components/ui';
import { CurrencySwitcher } from '@/src/features/dashboard/components/CurrencySwitcher';
import { StreakBadge } from '@/src/features/reports/components/StreakBadge';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { formatCurrency } from '@/src/utils/format';

type Props = {
  balance: number;
  currency: string;
  /** Income minus expense so far this month; null while loading. */
  monthNet: number | null;
  currencies: string[];
  /** Balance per currency, listed in the currency sheet. */
  balances: Record<string, number>;
  onCurrencySelect: (currency: string) => void;
  /** Rendered under the balance — the quick actions. */
  children?: ReactNode;
};

/**
 * The one number that matters, with this month's direction beneath it and the everyday actions
 * right under it. Month detail lives in the pulse widget below, so the hero stays uncluttered.
 */
export const HeroBalanceCard = React.memo(function HeroBalanceCard({ balance, currency, monthNet, currencies, balances, onCurrencySelect, children }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { heroCard: hero } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isUp = (monthNet ?? 0) >= 0;
  // A flat month reads "$0.00 this month", not "+$0.00".
  const sign = !monthNet || Math.round(Math.abs(monthNet) * 100) === 0 ? '' : isUp ? '+' : '−';

  return (
    <HeroSurface style={styles.margin}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="caption" color={hero.textMuted}>
            {t('dashboard.balance')}
          </Text>
          <StreakBadge />
        </View>
        <CurrencySwitcher currencies={currencies} selected={currency} onSelect={onCurrencySelect} amounts={balances} />
      </View>

      <View style={styles.figure}>
        {/* Shrinks rather than wraps or clips when the balance runs long. */}
        <MoneyText
          amount={balance}
          currency={currency}
          style={styles.balance}
          weight="bold"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.55}
        />
        {monthNet !== null ? (
          <View style={styles.net}>
            <Icon name={isUp ? 'trend-up' : 'trend-down'} size={14} color={hero.textPrimary} weight="bold" />
            <Text variant="label" color={hero.textPrimary} numberOfLines={1} style={styles.netText}>
              {t('dashboard.netThisMonth', { amount: `${sign}${formatCurrency(Math.abs(monthNet), currency)}` })}
            </Text>
          </View>
        ) : null}
      </View>

      {children}
    </HeroSurface>
  );
});

const createStyles = ({ heroCard: hero, spacing, radius, layout, typography }: ThemeContextType) =>
  StyleSheet.create({
    margin: { marginHorizontal: layout.screenPadding },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing('3'), minHeight: 32 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing('2'), flexShrink: 1 },
    figure: { gap: spacing('2') },
    balance: { ...typography.metrics.display, color: hero.textPrimary },
    // A frosted pill, so the month's direction reads as a tag on the balance, not a second figure.
    net: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
      height: 26,
      paddingHorizontal: spacing('2.5'),
      borderRadius: radius('full'),
      backgroundColor: hero.tile,
      alignSelf: 'flex-start',
      maxWidth: '100%',
    },
    netText: { flexShrink: 1 },
  });
