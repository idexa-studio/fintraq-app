import React, { useMemo, useState, useCallback } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import { alpha } from '@/src/theme/tokens';
import type { IconSource } from './Icon';
import { Icon } from './Icon';

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'default' | 'minimal' | 'filled';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Guidance shown under the field when there is no error. */
  helperText?: string;
  size?: InputSize;
  variant?: InputVariant;
  leadingIcon?: IconSource;
  /** Clear button, unit label, visibility toggle… */
  trailing?: React.ReactNode;
}

const FONT_SIZES: Record<InputSize, number> = { sm: 14, md: 16, lg: 18 };

export const Input = React.memo(function Input({
  label,
  error,
  helperText,
  leadingIcon,
  trailing,
  size = 'md',
  variant = 'default',
  style,
  placeholderTextColor,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const theme = useTheme();
  const { colors, sizes, typography } = theme;
  const styles = useMemo(() => createStyles(theme, size), [theme, size]);
  const [isFocused, setIsFocused] = useState(false);

  const sizeConfig = sizes.input[size];

  const containerStyle = useMemo(() => {
    const activeColor = error ? colors.danger : colors.primary;

    switch (variant) {
      case 'filled':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: isFocused ? activeColor : error ? alpha(colors.danger, 'strong') : 'transparent',
        };
      case 'minimal':
        return {
          backgroundColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: isFocused ? activeColor + 'A0' : error ? alpha(colors.danger, 'strong') : alpha(colors.text, 'subtle'),
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: isFocused ? activeColor : error ? alpha(colors.danger, 'strong') : 'transparent',
        };
    }
  }, [variant, error, colors, isFocused]);

  const handleFocus = useCallback<NonNullable<TextInputProps['onFocus']>>((event) => {
    setIsFocused(true);
    onFocus?.(event);
  }, [onFocus]);

  const handleBlur = useCallback<NonNullable<TextInputProps['onBlur']>>((event) => {
    setIsFocused(false);
    onBlur?.(event);
  }, [onBlur]);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { fontFamily: typography.fonts.medium, color: colors.textMuted }]}>{label}</Text> : null}
      <View style={[styles.box, { height: sizeConfig.height, paddingHorizontal: variant === 'minimal' ? 0 : sizeConfig.paddingHorizontal, borderRadius: variant === 'minimal' ? 0 : sizeConfig.borderRadius }, containerStyle]}>
        {leadingIcon ? (
          <Icon icon={leadingIcon} size={18} color={isFocused ? colors.text : colors.textMuted} />
        ) : null}
        <TextInput
          accessibilityLabel={props.accessibilityLabel ?? label}
          style={[styles.input, { fontFamily: typography.fonts.regular, color: colors.text, fontSize: FONT_SIZES[size] }, variant === 'minimal' && { paddingHorizontal: 0 }, style]}
          placeholderTextColor={placeholderTextColor || alpha(colors.textMuted, 'strong')}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {trailing}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { fontFamily: typography.fonts.medium, color: colors.danger }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.error, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
});

const createStyles = ({ typography, spacing }: ThemeContextType, _size: InputSize) =>
  StyleSheet.create({
    wrap: { marginBottom: 0 },
    label: { ...typography.metrics.xs, marginBottom: spacing('2') },
    box: { overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: spacing('2.5') },
    input: { flex: 1, height: '100%', paddingVertical: 0, includeFontPadding: false },
    error: { ...typography.metrics.xs, marginTop: spacing('1') },
  });
