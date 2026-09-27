import { Text } from './Text';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import React, { forwardRef, useMemo, useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

type FormFieldProps = TextInputProps & {
  label: string;
  error?: string;
  helperText?: string;
  /** Right-side accessory: unit, currency button, clear icon. */
  trailing?: React.ReactNode;
  /** Large amount-style value (balances, prices). */
  large?: boolean;
};

/**
 * A text field row for grouped forms: small label on top, value underneath,
 * error or helper below. Stack several inside <ListGroup insetDividers={false}>.
 * The stacked label never truncates, whatever the language.
 */
export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
  { label, error, helperText, trailing, large = false, editable = true, style, onFocus, onBlur, ...inputProps },
  ref,
) {
  const theme = useTheme();
  const { colors, alpha } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.row, !editable && styles.locked]}>
      <Text variant="label" tone={error ? 'danger' : focused ? 'primary' : 'muted'}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          ref={ref}
          editable={editable}
          accessibilityLabel={label}
          placeholderTextColor={alpha(colors.textMuted, 'strong')}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[styles.input, large && styles.inputLarge, style]}
          {...inputProps}
        />
        {trailing}
      </View>
      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">{error}</Text>
      ) : helperText ? (
        <Text variant="caption" tone="muted">{helperText}</Text>
      ) : null}
    </View>
  );
});

const createStyles = ({ colors, spacing, typography }: ThemeContextType) =>
  StyleSheet.create({
    row: {
      gap: spacing('1'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
      backgroundColor: colors.surface,
    },
    locked: { opacity: 0.6 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
    input: {
      flex: 1,
      paddingVertical: spacing('0.5'),
      color: colors.text,
      fontFamily: typography.fonts.regular,
      ...typography.metrics.lg,
    },
    inputLarge: {
      fontFamily: typography.fonts.amountBold,
      ...typography.metrics.xxl,
    },
  });
