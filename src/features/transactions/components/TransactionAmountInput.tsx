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
      <Text style={styles.label}>Amount</Text>
      <View style={styles.inputRow}>
        <Text style={styles.currency}>{currency}</Text>
        <TextInput
          style={styles.input}
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

const createStyles = ({ colors, typography, spacing, radius, layout, sizes }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: sizes.card.lg.borderRadius,
      padding: sizes.card.lg.padding,
      marginHorizontal: layout.screenPadding,
      marginVertical: spacing('2'),
    },
    label: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      opacity: 0.6,
      marginBottom: spacing('1.5'),
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    currency: {
      fontSize: 22,
      fontFamily: typography.fonts.semibold,
      color: colors.textMuted,
      marginRight: spacing('2.5'),
    },
    input: {
      flex: 1,
      fontSize: 40,
      fontFamily: typography.fonts.bold,
      color: colors.text,
      paddingVertical: 0,
    },
  });
