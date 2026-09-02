import { Calculator01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CalculatorBottomSheet } from '../../../components/ui/CalculatorBottomSheet';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';

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

  const [showCalc, setShowCalc] = useState(false);

  const handleChange = useCallback((v: string) => onChange(v), [onChange]);
  const handleCalcConfirm = useCallback((v: string) => onChange(v), [onChange]);

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
        <Pressable
          style={({ pressed }) => [styles.calcBtn, pressed && { opacity: 0.5 }]}
          onPress={() => { Keyboard.dismiss(); setShowCalc(true); }}
          hitSlop={8}
        >
          <HugeiconsIcon icon={Calculator01Icon} size={22} color={colors.textMuted} />
        </Pressable>
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
      borderRadius: sizes.card.lg.borderRadius,
      padding: sizes.card.lg.padding,
      marginHorizontal: layout.screenPadding,
      marginVertical: spacing('2'),
    },
    label: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
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
      fontFamily: typography.styles.rowLabel.fontFamily,
      color: colors.textMuted,
      marginRight: spacing('2.5'),
    },
    input: {
      flex: 1,
      fontSize: 40,
      fontFamily: typography.styles.buttonLabel.fontFamily,
      color: colors.text,
      paddingVertical: 0,
    },
    calcBtn: {
      padding: spacing('1'),
      marginLeft: spacing('2'),
    },
  });
