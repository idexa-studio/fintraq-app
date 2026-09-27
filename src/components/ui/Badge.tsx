import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/src/providers/ThemeProvider';
import { alpha } from '@/src/theme/tokens';

type BadgeVariant =
  /** Tinted pill — type labels, status labels, currency codes */
  | 'label'
  /** Solid primary pill — count numbers, tab counts */
  | 'count'
  /** Muted surface pill — neutral metadata */
  | 'muted';

type BadgeProps = {
  label: string | number;
  variant?: BadgeVariant;
  /** Accent color for tinted label variant. Defaults to theme primary. */
  color?: string;
  style?: ViewStyle;
};

export const Badge = React.memo(function Badge({
  label,
  variant = 'label',
  color,
  style,
}: BadgeProps) {
  const { colors, typography } = useTheme();

  const accent = color ?? colors.primary;

  const { bg, textColor } = useMemo(() => {
    switch (variant) {
      case 'count':
        // Lime primary needs dark text; every other accent is dark enough for white.
        return { bg: accent, textColor: accent === colors.primary ? colors.primaryForeground : '#FFFFFF' };
      case 'muted':
        return { bg: alpha(colors.text, 'faint'), textColor: colors.textMuted };
      case 'label':
      default:
        return { bg: alpha(accent, 'subtle'), textColor: color ?? colors.primaryInk };
    }
  }, [variant, accent, color, colors.primary, colors.primaryInk, colors.primaryForeground, colors.text, colors.textMuted]);

  const textStyle = useMemo(
    () => ({
      fontFamily: typography.styles.badge.fontFamily,
      ...typography.metrics.xxs,
      color: textColor,
      includeFontPadding: false,
    }),
    [typography, textColor],
  );

  return (
    <View style={[styles.base, { backgroundColor: bg }, style]}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    paddingHorizontal: 7,
    borderRadius: 999,
  },
});
