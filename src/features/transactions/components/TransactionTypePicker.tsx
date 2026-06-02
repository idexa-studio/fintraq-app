import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';
import type { TransactionType } from '../../../types';

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
      <TouchableOpacity
        style={[
          styles.pill,
          { backgroundColor: colors.surface, borderColor: colors.border },
          value === 'DR' && { backgroundColor: colors.danger, borderColor: colors.danger },
          disabled && value !== 'DR' && styles.pillHidden,
        ]}
        onPress={handleDR}
        activeOpacity={disabled ? 1 : 0.8}
      >
        <Text style={[styles.pillText, { color: value === 'DR' ? colors.background : colors.textMuted }]}>
          Expense
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.pill,
          { backgroundColor: colors.surface, borderColor: colors.border },
          value === 'CR' && { backgroundColor: colors.success, borderColor: colors.success },
          disabled && value !== 'CR' && styles.pillHidden,
        ]}
        onPress={handleCR}
        activeOpacity={disabled ? 1 : 0.8}
      >
        <Text style={[styles.pillText, { color: value === 'CR' ? colors.background : colors.textMuted }]}>
          Income
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.pill,
          { backgroundColor: colors.surface, borderColor: colors.border },
          value === 'TR' && { backgroundColor: colors.primary, borderColor: colors.primary },
          disabled && value !== 'TR' && styles.pillHidden,
        ]}
        onPress={handleTR}
        activeOpacity={disabled ? 1 : 0.8}
      >
        <Text style={[styles.pillText, { color: value === 'TR' ? colors.background : colors.textMuted }]}>
          Transfer
        </Text>
      </TouchableOpacity>
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
      borderWidth: 1,
    },
    pillHidden: {
      display: 'none',
    },
    pillText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 13,
    },
  });
