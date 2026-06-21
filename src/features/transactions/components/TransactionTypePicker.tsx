import { AddCircleIcon, ArrowDataTransferHorizontalIcon, MinusSignCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
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
      <View style={styles.segmentContainer}>
        <BentoPressable
          style={[
            styles.segmentButton,
            value === 'DR' && { backgroundColor: colors.danger + '14' },
            disabled && value !== 'DR' && styles.pillHidden,
          ]}
          onPress={handleDR}
          disabled={disabled}
        >
          <View style={styles.contentRow}>
            <HugeiconsIcon
              icon={MinusSignCircleIcon}
              size={15}
              color={value === 'DR' ? colors.danger : colors.textMuted}
            />
            <Text style={[styles.pillText, { color: value === 'DR' ? colors.danger : colors.textMuted }]}>
              Expense
            </Text>
          </View>
        </BentoPressable>

        <BentoPressable
          style={[
            styles.segmentButton,
            value === 'CR' && { backgroundColor: colors.success + '14' },
            disabled && value !== 'CR' && styles.pillHidden,
          ]}
          onPress={handleCR}
          disabled={disabled}
        >
          <View style={styles.contentRow}>
            <HugeiconsIcon
              icon={AddCircleIcon}
              size={15}
              color={value === 'CR' ? colors.success : colors.textMuted}
            />
            <Text style={[styles.pillText, { color: value === 'CR' ? colors.success : colors.textMuted }]}>
              Income
            </Text>
          </View>
        </BentoPressable>

        <BentoPressable
          style={[
            styles.segmentButton,
            value === 'TR' && { backgroundColor: colors.primary + '14' },
            disabled && value !== 'TR' && styles.pillHidden,
          ]}
          onPress={handleTR}
          disabled={disabled}
        >
          <View style={styles.contentRow}>
            <HugeiconsIcon
              icon={ArrowDataTransferHorizontalIcon}
              size={15}
              color={value === 'TR' ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.pillText, { color: value === 'TR' ? colors.primary : colors.textMuted }]}>
              Transfer
            </Text>
          </View>
        </BentoPressable>
      </View>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout, sizes }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: spacing('2'),
    },
    containerDisabled: {
      opacity: 0.75,
    },
    segmentContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('1'),
      gap: spacing('1'),
      height: sizes.button.md.height,
      alignItems: 'center',
    },
    segmentButton: {
      flex: 1,
      height: '100%',
      borderRadius: radius('lg'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
    },
    pillHidden: {
      display: 'none',
    },
    pillText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 13,
    },
  });
