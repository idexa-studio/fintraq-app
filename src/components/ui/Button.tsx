import { Icon } from './Icon';
import type { IconSource } from './Icon';
import React, { useMemo, useCallback } from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import { BentoPressable } from './BentoPressable';

export type ButtonVariant = 'primary' | 'tonal' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  /** Stretch to the parent's width — form submits, sheet actions. */
  fullWidth?: boolean;
  icon?: IconSource;
  iconPosition?: 'leading' | 'trailing';
  /** Defaults to the title; set it when the title alone is ambiguous (e.g. a currency code). */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
};

const ICON_SIZE: Record<ButtonSize, number> = { sm: 16, md: 19, lg: 20 };

export const Button = React.memo(function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'leading',
  accessibilityLabel,
  accessibilityHint,
  style,
  textStyle,
}: ButtonProps) {
  const theme = useTheme();
  const { colors, sizes, alpha } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const sizeConfig = sizes.button[size];

  const { textColor, backgroundColor, borderColor } = useMemo(() => {
    switch (variant) {
      case 'primary':
        return { textColor: colors.primaryForeground, backgroundColor: colors.primary, borderColor: 'transparent' };
      case 'tonal':
        return { textColor: colors.primaryInk, backgroundColor: alpha(colors.primary, 'subtle'), borderColor: 'transparent' };
      case 'danger':
        return { textColor: '#FFFFFF', backgroundColor: colors.danger, borderColor: 'transparent' };
      case 'success':
        // Success is mid-green in light mode, bright mint in dark: flip the label for contrast.
        return { textColor: theme.isDark ? colors.primaryForeground : '#FFFFFF', backgroundColor: colors.success, borderColor: 'transparent' };
      case 'secondary':
        return { textColor: colors.text, backgroundColor: colors.surface, borderColor: 'transparent' };
      case 'outline':
        return { textColor: colors.text, backgroundColor: 'transparent', borderColor: alpha(colors.text, 'subtle') };
      case 'ghost':
      default:
        return { textColor: colors.text, backgroundColor: 'transparent', borderColor: 'transparent' };
    }
  }, [variant, colors, alpha, theme.isDark]);

  const handlePress = useCallback(() => {
    if (!disabled && !isLoading) onPress();
  }, [disabled, isLoading, onPress]);

  const iconNode = icon && !isLoading
    ? <Icon icon={icon} size={ICON_SIZE[size]} color={textColor} weight="bold" />
    : null;

  return (
    <BentoPressable
      style={[
        styles.base,
        {
          height: sizeConfig.height,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          borderRadius: sizeConfig.borderRadius,
          backgroundColor,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor,
          opacity: disabled ? 0.45 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || isLoading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
    >
      {iconPosition === 'leading' ? iconNode : null}

      {isLoading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text
          numberOfLines={1}
          style={[styles.text, { color: textColor, fontSize: sizeConfig.fontSize }, textStyle]}
        >
          {title}
        </Text>
      )}

      {iconPosition === 'trailing' ? iconNode : null}
    </BentoPressable>
  );
});

const createStyles = ({ typography, spacing }: ThemeContextType) => StyleSheet.create({
  base: {
    minWidth: 88,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing('2'),
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  text: {
    fontFamily: typography.styles.buttonLabel.fontFamily,
    includeFontPadding: false,
  },
});
