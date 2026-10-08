import React, { useMemo } from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { formatCurrency } from '@/shared/format/money';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import { TransactionType } from '@/shared/types';
import { useCountUp } from './useCountUp';

interface MoneyTextProps extends TextProps {
  amount: number;
  currency?: string;
  type?: TransactionType | 'NONE';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  /** Abbreviate large amounts: $1.2K, $3.4M */
  compact?: boolean;
  /**
   * Room in characters (sign and symbol included). A longer full amount switches to the compact
   * form instead of being shrunk or cut off; screen readers still hear the exact figure.
   */
  maxChars?: number;
  /** Count up to the amount when it appears or changes. For a screen's headline figure only. */
  animate?: boolean;
}

export const MoneyText = React.memo(function MoneyText({
  amount,
  currency,
  type = 'NONE',
  weight = 'bold',
  compact = false,
  maxChars,
  animate = false,
  style,
  ...props
}: MoneyTextProps) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const shownAmount = useCountUp(amount, animate);

  const { prefix, color, formattedAmount, fullAmount, fontFamily } = useMemo(() => {
    const isCustomSign = type === 'CR' || type === 'DR';
    const valToFormat = isCustomSign ? Math.abs(shownAmount) : shownAmount;
    // Length and the spoken label come from the real amount, so the layout doesn't jump and a
    // screen reader never announces a figure mid-count.
    const full = formatCurrency(isCustomSign ? Math.abs(amount) : amount, currency, false);
    const signChars = isCustomSign ? 1 : 0;
    const tooLong = maxChars !== undefined && full.length + signChars > maxChars;
    const formatted = formatCurrency(valToFormat, currency, compact || tooLong);

    let p = '';
    let c = colors.text;
    // Nothing moved: "+$0" / "-$0" would claim a direction, so zero is always unsigned and neutral.
    const isZero = Math.round(Math.abs(amount) * 100) === 0;

    if (!isZero && type === 'CR') {
      p = '+';
      c = colors.success;
    } else if (!isZero && type === 'DR') {
      p = '-';
      c = colors.danger;
    }

    let ff: string;
    if (weight === 'regular') ff = typography.fonts.amountLight;
    else if (weight === 'medium') ff = typography.fonts.amountRegular;
    else if (weight === 'semibold') ff = typography.fonts.amountRegular;
    else ff = typography.fonts.amountBold;

    return { prefix: p, color: c, formattedAmount: formatted, fullAmount: full, fontFamily: ff };
  }, [amount, shownAmount, currency, type, weight, compact, maxChars, colors.text, colors.success, colors.danger, typography.fonts]);

  return (
    <Text
      style={[
        styles.base,
        { color, fontFamily },
        style
      ]}
      numberOfLines={1}
      ellipsizeMode="tail"
      accessibilityLabel={`${prefix}${fullAmount}`}
      {...props}
    >
      {prefix}{formattedAmount}
    </Text>
  );
});

const createStyles = ({ typography }: ThemeContextType) => StyleSheet.create({
  base: {
    ...typography.metrics.md,
    flexShrink: 1,
    includeFontPadding: false,
  }
});
