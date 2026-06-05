import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';

type Props = {
  value: string;
  onChange: (value: string) => void;
  currency: string;
};

export const TransactionAmountInput = React.memo(function TransactionAmountInput({
  value,
  onChange,
  currency,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleChange = useCallback((v: string) => onChange(v), [onChange]);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Amount</Text>
      <View style={styles.inputRow}>
        <Text style={[styles.currency, { color: colors.textMuted }]}>{currency}</Text>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.textMuted + '40'}
          autoFocus
        />
      </View>
    </View>
  );
});

const createStyles = ({ typography, spacing , layout }: ThemeContextType) => StyleSheet.create({
  container: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing('3'),
  },
  label: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.xs,
    marginBottom: spacing('2'),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing('3'),
  },
  currency: {
    fontSize: 24,
    fontFamily: typography.fonts.medium,
  },
  input: {
    flex: 1,
    fontSize: 48,
    fontFamily: typography.fonts.bold,
  },
});
