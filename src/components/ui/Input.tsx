import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'default' | 'minimal' | 'filled';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  size?: InputSize;
  variant?: InputVariant;
}

const FONT_SIZES: Record<InputSize, number> = { sm: 14, md: 16, lg: 18 };

export const Input = React.memo(function Input({
  label,
  error,
  size = 'md',
  variant = 'default',
  style,
  placeholderTextColor,
  ...props
}: InputProps) {
  const theme = useTheme();
  const { colors, sizes, typography } = theme;
  const styles = useMemo(() => createStyles(theme, size), [theme, size]);

  const sizeConfig = sizes.input[size];

  const containerStyle = useMemo(() => {
    switch (variant) {
      case 'filled':
        return { backgroundColor: colors.surface, borderWidth: 0 };
      case 'minimal':
        return { backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: error ? colors.danger : colors.text + '0C' };
      case 'default':
      default:
        return {
          backgroundColor: colors.surface,
          borderWidth: error ? 1 : 0,
          borderColor: error ? colors.danger : 'transparent',
        };
    }
  }, [variant, error, colors]);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { fontFamily: typography.fonts.medium, color: colors.textMuted }]}>{label}</Text> : null}
      <View style={[styles.box, { height: sizeConfig.height, paddingHorizontal: variant === 'minimal' ? 0 : sizeConfig.paddingHorizontal, borderRadius: variant === 'minimal' ? 0 : sizeConfig.borderRadius }, containerStyle]}>
        <TextInput
          style={[styles.input, { fontFamily: typography.fonts.regular, color: colors.text, fontSize: FONT_SIZES[size] }, variant === 'minimal' && { paddingHorizontal: 0 }, style]}
          placeholderTextColor={placeholderTextColor || colors.textMuted + '80'}
          {...props}
        />
      </View>
      {error ? <Text style={[styles.error, { fontFamily: typography.fonts.medium, color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
});

const createStyles = ({ typography, spacing }: ThemeContextType, _size: InputSize) =>
  StyleSheet.create({
    wrap: { marginBottom: 0 },
    label: { fontSize: typography.sizes.xs, marginBottom: spacing('2') },
    box: { overflow: 'hidden', justifyContent: 'center' },
    input: { paddingVertical: 0 },
    error: { fontSize: typography.sizes.xs, marginTop: spacing('1') },
  });
