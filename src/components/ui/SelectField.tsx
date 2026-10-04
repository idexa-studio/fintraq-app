import { BentoPressable } from './BentoPressable';
import { Icon, IconSource } from './Icon';
import { Text } from './Text';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

type SelectFieldProps = {
  label: string;
  /** Current value; falls back to the placeholder when empty. */
  value?: string;
  placeholder?: string;
  onPress: () => void;
  /** Optional leading visual (avatar, icon tile). */
  leading?: React.ReactNode;
  /** Replaces the chevron (calendar icon, clear button…). */
  trailingIcon?: IconSource;
  error?: string;
  disabled?: boolean;
};

/**
 * A form row that opens a picker (sheet, date/time picker, list). Same shape as
 * FormField so they stack together inside <ListGroup insetDividers={false}>.
 */
export const SelectField = React.memo(function SelectField({
  label,
  value,
  placeholder,
  onPress,
  leading,
  trailingIcon = 'chevron-right',
  error,
  disabled = false,
}: SelectFieldProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const hasValue = !!value;

  return (
    <BentoPressable
      onPress={onPress}
      disabled={disabled}
      scaleOnPress={false}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value || placeholder || ''}`}
      style={[styles.row, disabled && { opacity: theme.state.disabled }]}
    >
      {leading}
      <View style={styles.body}>
        <Text variant="label" tone={error ? 'danger' : 'muted'}>{label}</Text>
        <Text variant="body" tone={hasValue ? 'default' : 'muted'} numberOfLines={1} style={styles.value}>
          {hasValue ? value : placeholder}
        </Text>
        {error ? <Text variant="caption" tone="danger">{error}</Text> : null}
      </View>
      <Icon name={trailingIcon} size={18} color={theme.colors.textMuted} />
    </BentoPressable>
  );
});

const createStyles = ({ colors, spacing, typography }: ThemeContextType) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
      backgroundColor: colors.surface,
    },
    body: { flex: 1, gap: spacing('1') },
    value: { ...typography.metrics.lg },
  });
