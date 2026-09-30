import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import React, { ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Icon, MoneyText, Text } from '@/src/components/ui';
import { CurrencyPickerTab } from '@/src/features/dashboard/components/CurrencyPickerTab';
import { StreakBadge } from '@/src/features/reports/components/StreakBadge';
import { HeroCardPalette, ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { formatCurrency } from '@/src/utils/format';

type Props = {
  balance: number;
  currency: string;
  /** Income minus expense so far this month; null while loading. */
  monthNet: number | null;
  currencies?: string[];
  onCurrencySelect?: (currency: string) => void;
  /** Rendered under the balance, above the currency tabs — the quick actions. */
  children?: ReactNode;
};

/**
 * The one number that matters, with this month's direction beneath it and the everyday actions
 * right under it. Month detail lives in the pulse widget below, so the hero stays uncluttered.
 */
export const HeroBalanceCard = React.memo(function HeroBalanceCard({ balance, currency, monthNet, currencies, onCurrencySelect, children }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { heroCard } = theme;
  const styles = useMemo(() => createStyles(theme, heroCard), [theme, heroCard]);

  const isUp = (monthNet ?? 0) >= 0;
  const netLabel =
    monthNet === null ? null : t('dashboard.netThisMonth', { amount: `${isUp ? '+' : '−'}${formatCurrency(Math.abs(monthNet), currency)}` });

  return (
    <View style={styles.card}>
      {/* Decorative rings: depth without a gradient or shadow, both off-system. */}
      <View style={[styles.ring, styles.ringLarge]} pointerEvents="none" />
      <View style={[styles.ring, styles.ringSmall]} pointerEvents="none" />

      <View style={styles.header}>
        <Text variant="caption" color={heroCard.textMuted}>
          {t('dashboard.balance')}
        </Text>
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

      {netLabel ? (
        <View style={styles.netPill}>
          <Icon icon={isUp ? ArrowUp01Icon : ArrowDown01Icon} size={14} color={isUp ? heroCard.income : heroCard.expense} weight="bold" />
          <Text variant="label" color={heroCard.textPrimary} numberOfLines={1}>
            {netLabel}
          </Text>
        </View>
      ) : null}

      {children}

      <CurrencyPickerTab currencies={currencies ?? []} selectedCurrency={currency} onCurrencySelect={onCurrencySelect} heroCard={heroCard} />
    </View>
  );
});

const RING_LARGE = 220;
const RING_SMALL = 120;

const createStyles = ({ spacing, radius, layout, typography }: ThemeContextType, heroCard: HeroCardPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: heroCard.background,
      marginHorizontal: layout.screenPadding,
      borderRadius: radius('2xl'),
      padding: spacing('5'),
      gap: spacing('3'),
      overflow: 'hidden',
    },
    ring: { position: 'absolute', borderRadius: radius('full'), borderColor: heroCard.decoOverlay },
    ringLarge: { width: RING_LARGE, height: RING_LARGE, borderWidth: 28, top: -RING_LARGE * 0.45, right: -RING_LARGE * 0.3 },
    ringSmall: { width: RING_SMALL, height: RING_SMALL, borderWidth: 16, bottom: -RING_SMALL * 0.5, right: RING_SMALL * 0.35 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 24,
      marginBottom: -spacing('2'),
    },
    balance: {
      ...typography.metrics.display,
      color: heroCard.textPrimary,
    },
    netPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing('1'),
      height: 28,
      paddingHorizontal: spacing('2.5'),
      borderRadius: radius('full'),
      backgroundColor: heroCard.separator,
      marginTop: -spacing('1'),
    },
  });
