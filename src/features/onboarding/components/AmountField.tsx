import React, { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/src/components/ui';
import { getCurrencySymbol } from '@/shared/currency/currencies';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type AmountFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  currency: string;
  error?: string;
  helperText?: string;
};

/** The big figure field from the transaction form, without its card — the number is the hero of the step. */
export const AmountField = React.memo(function AmountField({ label, value, onChangeText, currency, error, helperText }: AmountFieldProps) {
  const theme = useTheme();
  const { colors, alpha } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const note = error ?? helperText;

  return (
    <View style={styles.root}>
      <Text variant="label" tone="muted">{label}</Text>
      <View style={styles.row}>
        <Text style={styles.symbol}>{getCurrencySymbol(currency)}</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={alpha(colors.textMuted, 'medium')}
          selectionColor={colors.primaryInk}
          maxLength={16}
          accessibilityLabel={label}
        />
      </View>
      {note ? <Text variant="caption" tone={error ? 'danger' : 'muted'}>{note}</Text> : null}
    </View>
  );
});

const createStyles = ({ colors, typography, spacing }: ThemeContextType) =>
  StyleSheet.create({
    root: { gap: spacing('1.5') },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
    symbol: { ...typography.metrics.display, fontFamily: typography.fonts.amountRegular, color: colors.textMuted },
    // minWidth 0 lets the field shrink inside the row instead of widening it to fit the text. The
    // explicit height keeps Android from clipping the figure's ascenders to the line box.
    input: {
      flex: 1,
      minWidth: 0,
      height: typography.metrics.jumbo.lineHeight + spacing('2'),
      ...typography.metrics.jumbo,
      fontFamily: typography.fonts.amountBold,
      color: colors.text,
      paddingVertical: 0,
      textAlignVertical: 'center',
    },
  });
