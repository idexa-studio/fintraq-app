import { alpha } from '@/src/theme/tokens';
import { Text } from '@/src/components/ui/Text';
import { getCurrencySymbol } from '@/shared/currency/currencies';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';
import { IconButton } from '@/src/components/ui/IconButton';
import { CalculatorBottomSheet } from '@/src/components/pickers/CalculatorBottomSheet';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

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
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [showCalc, setShowCalc] = useState(false);
  // Show the symbol people recognise (₹, $, €); fall back to the code.
  const symbol = getCurrencySymbol(currency);

  const handleChange = useCallback((v: string) => onChange(v), [onChange]);
  const handleCalcConfirm = useCallback((v: string) => onChange(v), [onChange]);

  return (
    <View style={styles.container}>
      <Text variant="label" tone="muted" style={styles.label}>{t('transactions.amount')}</Text>
      <View style={styles.inputRow}>
        <Text style={styles.currency}>{symbol}</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={alpha(colors.textMuted, 'medium')}
          autoFocus
        />
        <IconButton
          icon="calculator"
          variant="tonal"
          onPress={() => { Keyboard.dismiss(); setShowCalc(true); }}
          accessibilityLabel={t('transactions.calculator')}
          style={styles.calculator}
        />
      </View>

      <CalculatorBottomSheet
        visible={showCalc}
        onClose={() => setShowCalc(false)}
        value={value}
        onConfirm={handleCalcConfirm}
        currency={currency}
      />
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout, sizes }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: sizes.card.lg.padding,
      marginHorizontal: layout.screenPadding,
      marginVertical: spacing('2'),
    },
    label: {
      marginBottom: spacing('1.5'),
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    currency: {
      ...typography.metrics.display,
      fontFamily: typography.fonts.amountRegular,
      color: colors.textMuted,
      marginRight: spacing('2'),
    },
    // minWidth 0 lets the field shrink inside the row instead of widening it to fit the text.
    input: {
      flex: 1,
      minWidth: 0,
      ...typography.metrics.jumbo,
      fontFamily: typography.fonts.amountBold,
      color: colors.text,
      paddingVertical: 0,
    },
    calculator: {
      marginLeft: spacing('2'),
    },
  });
