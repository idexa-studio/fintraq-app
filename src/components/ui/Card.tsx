import React, { useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '@/src/providers/ThemeProvider';
import { BentoPressable } from './BentoPressable';

type CardSize = 'sm' | 'md' | 'lg';
/**
 * surface  — standard container on the page background (default)
 * inset    — nested block inside a surface card (uses the `card` fill)
 * outlined — low-emphasis container, border only
 */
type CardVariant = 'surface' | 'inset' | 'outlined';

type CardProps = {
  children: React.ReactNode;
  size?: CardSize;
  variant?: CardVariant;
  /** Makes the whole card a single tap target. */
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export const Card = React.memo(function Card({
  children,
  size = 'md',
  variant = 'surface',
  onPress,
  accessibilityLabel,
  style,
}: CardProps) {
  const { colors, sizes, alpha } = useTheme();
  const sizeConfig = sizes.card[size];

  const cardStyle = useMemo<ViewStyle>(() => {
    const base: ViewStyle = { padding: sizeConfig.padding, borderRadius: sizeConfig.borderRadius, overflow: 'hidden' };
    switch (variant) {
      case 'inset':
        return { ...base, backgroundColor: colors.card };
      case 'outlined':
        return { ...base, backgroundColor: 'transparent', borderWidth: 1, borderColor: alpha(colors.text, 'subtle') };
      case 'surface':
      default:
        return { ...base, overflow: 'visible', backgroundColor: colors.surface };
    }
  }, [variant, sizeConfig, colors, alpha]);

  if (onPress) {
    return (
      <BentoPressable onPress={onPress} style={[cardStyle, style]} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
        {children}
      </BentoPressable>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
});
