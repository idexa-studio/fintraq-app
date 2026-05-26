import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';
import type { ShadowToken } from '../../theme/tokens';
import { FrostLayer } from './FrostLayer';

type CardSize = 'sm' | 'md' | 'lg';
type CardVariant = 'default' | 'filled' | 'outlined';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  size?: CardSize;
  variant?: CardVariant;
  shadow?: ShadowToken;
};

/**
 * Card - Editorial Brutalist Design
 * 
 * Size variants (padding + radius):
 * - sm: 12px padding, 16px radius (lg)
 * - md: 16px padding, 20px radius (xl) - DEFAULT
 * - lg: 20px padding, 24px radius (2xl)
 * 
 * Variants:
 * - default: Subtle surface background with blur
 * - filled: Solid surface background
 * - outlined: Border only, transparent background
 */
export const Card = React.memo(function Card({ 
  children, 
  style,
  size = 'md',
  variant = 'default',
  shadow: shadowToken,
}: CardProps) {
  const theme = useTheme();
  const { colors, sizes, shadow } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const sizeConfig = sizes.card[size];

  const backgroundStyle = useMemo(() => {
    switch (variant) {
      case 'filled':
        return { backgroundColor: colors.surface };
      case 'outlined':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border };
      case 'default':
      default:
        return { backgroundColor: 'transparent' };
    }
  }, [variant, colors.surface, colors.border]);

  const shadowStyle = useMemo(() => {
    if (shadowToken) return shadow(shadowToken);
    if (variant === 'default') return shadow('sm');
    return shadow('none');
  }, [shadowToken, variant, shadow]);

  return (
    <View
      style={[
        styles.card,
        {
          padding: sizeConfig.padding,
          borderRadius: sizeConfig.borderRadius,
        },
        backgroundStyle,
        shadowStyle,
        style,
      ]}
    >
      {variant === 'default' && (
        <FrostLayer intensity={25} androidColor={colors.card} borderRadius={sizeConfig.borderRadius} />
      )}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
});

const createStyles = ({ colors }: ThemeContextType) => StyleSheet.create({
  card: {
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
