import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { IconSource } from './Icon';
import { Icon } from './Icon';
import { MoneyText } from './MoneyText';
import { Text } from './Text';

export type HeroSplitSide = { label: string; amount: number; icon?: IconSource };

type Props = {
  /** Left tile: income, assets. */
  primary: HeroSplitSide;
  /** Right tile: expenses, debts. */
  secondary: HeroSplitSide;
  currency?: string;
};

/**
 * Two figures on a HeroSurface as translucent tiles — the hero's original stat row. Figures stay
 * in hero text colour (green or red type on lime fails contrast); the arrow says which way.
 */
export const HeroSplit = React.memo(function HeroSplit({ primary, secondary, currency }: Props) {
  const theme = useTheme();
  const { heroCard: hero } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const tile = (s: HeroSplitSide, fallbackIcon: IconSource) => (
    <View style={styles.tile}>
      <View style={styles.label}>
        <Icon name={s.icon ?? fallbackIcon} size={14} color={hero.textPrimary} weight="bold" />
        <Text variant="caption" color={hero.textMuted} numberOfLines={1} style={styles.labelText}>
          {s.label}
        </Text>
      </View>
      <MoneyText
        amount={s.amount}
        currency={currency}
        weight="semibold"
        style={styles.value}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      />
    </View>
  );

  return (
    <View style={styles.row}>
      {tile(primary, 'trend-up')}
      {tile(secondary, 'trend-down')}
    </View>
  );
});

const createStyles = ({ heroCard: hero, spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing('2.5') },
    tile: {
      flex: 1,
      minWidth: 0,
      backgroundColor: hero.tile,
      paddingVertical: spacing('2.5'),
      paddingHorizontal: spacing('3'),
      borderRadius: radius('lg'),
      gap: spacing('1'),
    },
    label: { flexDirection: 'row', alignItems: 'center', gap: spacing('1') },
    labelText: { flexShrink: 1 },
    value: { ...typography.metrics.md, color: hero.textPrimary },
  });
