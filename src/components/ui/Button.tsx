import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';
import { FrostLayer } from './FrostLayer';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: keyof typeof Ionicons.glyphMap;
};

/**
 * Button - Editorial Brutalist Design
 * 
 * Size variants:
 * - sm: 36px height, 12px radius (md)
 * - md: 48px height, 16px radius (lg) - DEFAULT
 * - lg: 56px height, 20px radius (xl)
 * 
 * Variants:
 * - primary: Filled with primary color
 * - secondary: Outlined with border
 * - outline: Same as secondary (alias)
 * - danger: Filled with danger color
 * - success: Filled with success color
 * - ghost: Transparent with text only
 */
export const Button = React.memo(function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const theme = useTheme();
  const { colors, sizes, spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const sizeConfig = sizes.button[size];

  const textColor = useMemo(() => {
    if (disabled) return colors.textMuted;
    if (variant === 'secondary' || variant === 'outline' || variant === 'ghost') return colors.text;
    return colors.background;
  }, [variant, disabled, colors.text, colors.textMuted, colors.background]);

  const backgroundColor = useMemo(() => {
    if (disabled) return colors.surface;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'danger': return colors.danger;
      case 'success': return colors.success;
      case 'secondary':
      case 'outline':
      case 'ghost':
      default:
        return 'transparent';
    }
  }, [variant, disabled, colors.primary, colors.danger, colors.success, colors.surface]);

  const borderColor = useMemo(() => {
    if (disabled) return colors.border;
    if (variant === 'secondary' || variant === 'outline') return colors.border;
    return 'transparent';
  }, [variant, disabled, colors.border]);

  const handlePress = useCallback(() => {
    if (!disabled && !isLoading) {
      onPress();
    }
  }, [disabled, isLoading, onPress]);

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          height: sizeConfig.height,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          borderRadius: sizeConfig.borderRadius,
          backgroundColor,
          borderColor,
          borderWidth: variant === 'secondary' || variant === 'outline' ? 1 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.75}
    >
      {(variant === 'secondary' || variant === 'outline') && (
        <FrostLayer intensity={20} borderRadius={sizeConfig.borderRadius} />
      )}
      
      {icon && !isLoading && (
        <Ionicons 
          name={icon} 
          size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} 
          color={textColor} 
          style={{ marginRight: spacing('2') }}
        />
      )}
      
      {isLoading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text 
          style={[
            styles.text, 
            { 
              color: textColor, 
              fontSize: sizeConfig.fontSize,
            }, 
            textStyle
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
});

const createStyles = ({ colors, typography }: ThemeContextType) => StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  text: {
    fontFamily: typography.fonts.semibold,
    fontWeight: typography.weights.semibold,
    letterSpacing: -0.2,
  },
});
