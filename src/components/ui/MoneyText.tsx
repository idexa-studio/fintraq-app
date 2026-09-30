import React, { useMemo } from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { formatCurrency } from '@/src/utils/format';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import { TransactionType } from '@/src/types';

interface MoneyTextProps extends TextProps {
  amount: number;
  currency?: string;
  type?: TransactionType | 'NONE';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  /** Abbreviate large amounts: $1.2K, $3.4M */
  compact?: boolean;
}

export const MoneyText = React.memo(function MoneyText({
  amount,
  currency,
  type = 'NONE',
  weight = 'bold',
  compact = false,
  style,
  ...props
}: MoneyTextProps) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { prefix, color, formattedAmount, fontFamily } = useMemo(() => {
    const isCustomSign = type === 'CR' || type === 'DR';
    const valToFormat = isCustomSign ? Math.abs(amount) : amount;
    const formatted = formatCurrency(valToFormat, currency, compact);

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

    return { prefix: p, color: c, formattedAmount: formatted, fontFamily: ff };
  }, [amount, currency, type, weight, compact, colors.text, colors.success, colors.danger, typography.fonts]);

  return (
    <Text
      style={[
        styles.base,
        { color, fontFamily },
        style
      ]}
      numberOfLines={1}
      ellipsizeMode="tail"
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
