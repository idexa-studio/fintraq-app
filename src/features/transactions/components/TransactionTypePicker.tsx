import { Text } from '@/src/components/ui/Text';
import { Icon } from '@/src/components/ui/Icon';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import type { TransactionType } from '@/src/types';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { useTranslation } from 'react-i18next';
import { alpha } from '@/src/theme/tokens';

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
  const { t } = useTranslation();
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
            value === 'DR' && { backgroundColor: alpha(colors.danger, 'subtle') },
            disabled && value !== 'DR' && styles.pillHidden,
          ]}
          onPress={handleDR}
          disabled={disabled}
        >
          <View style={styles.contentRow}>
            <Icon
              name="arrow-up-right"
              size={15}
              color={value === 'DR' ? colors.danger : colors.textMuted}
            />
            <Text style={[styles.pillText, { color: value === 'DR' ? colors.danger : colors.textMuted }]}>
              {t('transactions.expense')}
            </Text>
          </View>
        </BentoPressable>

        <BentoPressable
          style={[
            styles.segmentButton,
            value === 'CR' && { backgroundColor: alpha(colors.success, 'subtle') },
            disabled && value !== 'CR' && styles.pillHidden,
          ]}
          onPress={handleCR}
          disabled={disabled}
        >
          <View style={styles.contentRow}>
            <Icon
              name="arrow-down-left"
              size={15}
              color={value === 'CR' ? colors.success : colors.textMuted}
            />
            <Text style={[styles.pillText, { color: value === 'CR' ? colors.success : colors.textMuted }]}>
              {t('transactions.income')}
            </Text>
          </View>
        </BentoPressable>

        <BentoPressable
          style={[
            styles.segmentButton,
            value === 'TR' && { backgroundColor: alpha(colors.info, 'subtle') },
            disabled && value !== 'TR' && styles.pillHidden,
          ]}
          onPress={handleTR}
          disabled={disabled}
        >
          <View style={styles.contentRow}>
            <Icon
              name="arrows-left-right"
              size={15}
              color={value === 'TR' ? colors.info : colors.textMuted}
            />
            <Text style={[styles.pillText, { color: value === 'TR' ? colors.info : colors.textMuted }]}>
              {t('transactions.transfer')}
            </Text>
          </View>
        </BentoPressable>
      </View>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout, sizes, state }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: spacing('2'),
    },
    containerDisabled: {
      opacity: state.disabled,
    },
    segmentContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius('full'),
      padding: spacing('1'),
      gap: spacing('1'),
      height: sizes.button.md.height,
      alignItems: 'center',
    },
    segmentButton: {
      flex: 1,
      height: '100%',
      borderRadius: radius('full'),
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
      fontFamily: typography.styles.chipLabel.fontFamily,
      ...typography.metrics.sm,
    },
  });
