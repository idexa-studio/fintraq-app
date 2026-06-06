import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';
import type { TransactionType } from '../../../types';
import { BentoPressable } from '../../../components/ui/BentoPressable';

type Props = {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
  disabled?: boolean;
};

export const TransactionTypePicker = React.memo(function TransactionTypePicker({
  value,
  onChange,
  disabled = false,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleDR = useCallback(() => { if (!disabled) onChange('DR'); }, [onChange, disabled]);
  const handleCR = useCallback(() => { if (!disabled) onChange('CR'); }, [onChange, disabled]);
  const handleTR = useCallback(() => { if (!disabled) onChange('TR'); }, [onChange, disabled]);

  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      <BentoPressable
        style={[
          styles.pill,
          { backgroundColor: colors.surface },
          value === 'DR' && { backgroundColor: colors.danger + '18' },
          disabled && value !== 'DR' && styles.pillHidden,
        ]}
        onPress={handleDR}
        disabled={disabled}
      >
        <Text style={[styles.pillText, { color: value === 'DR' ? colors.danger : colors.textMuted }]}>
          Expense
        </Text>
      </BentoPressable>

      <BentoPressable
        style={[
          styles.pill,
          { backgroundColor: colors.surface },
          value === 'CR' && { backgroundColor: colors.success + '18' },
          disabled && value !== 'CR' && styles.pillHidden,
        ]}
        onPress={handleCR}
        disabled={disabled}
      >
        <Text style={[styles.pillText, { color: value === 'CR' ? colors.success : colors.textMuted }]}>
          Income
        </Text>
      </BentoPressable>

      <BentoPressable
        style={[
          styles.pill,
          { backgroundColor: colors.surface },
          value === 'TR' && { backgroundColor: colors.primary + '18' },
          disabled && value !== 'TR' && styles.pillHidden,
        ]}
        onPress={handleTR}
        disabled={disabled}
      >
        <Text style={[styles.pillText, { color: value === 'TR' ? colors.primary : colors.textMuted }]}>
          Transfer
        </Text>
      </BentoPressable>
    </View>
  );
});

const createStyles = ({ typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: spacing('2'),
      flexDirection: 'row',
      gap: spacing('2.5'),
    },
    containerDisabled: {
      opacity: 0.75,
    },
    pill: {
      paddingHorizontal: spacing('4'),
      height: 36,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    pillHidden: {
      display: 'none',
    },
    pillText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 13,
    },
  });
