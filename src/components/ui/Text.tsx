import { useTheme } from '@/src/providers/ThemeProvider';
import type { ThemeColors } from '@/src/theme/colors';
import type { TextVariant } from '@/src/theme/typography';
import React, { useMemo } from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';

export type TextTone =
  | 'default'
  | 'muted'
  | 'primary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'onPrimary';

export type TextProps = RNTextProps & {
  /** Type ramp entry — sets family, size, line height and tracking together. */
  variant?: TextVariant;
  /** Semantic colour. Use `color` only for data-driven colours (category, account). */
  tone?: TextTone;
  color?: string;
  align?: TextStyle['textAlign'];
  /** Nested span: inherit the parent's type, apply only colour/weight overrides. */
  inline?: boolean;
};

const toneColor = (tone: TextTone, colors: ThemeColors): string => {
  switch (tone) {
    case 'muted': return colors.textMuted;
    case 'primary': return colors.primaryInk;
    case 'success': return colors.success;
    case 'danger': return colors.danger;
    case 'warning': return colors.warning;
    case 'info': return colors.info;
    case 'onPrimary': return colors.primaryForeground;
    case 'default':
    default:
      return colors.text;
  }
};

export const Text = React.memo(function Text({
  variant = 'body',
  tone = 'default',
  color,
  align,
  inline = false,
  style,
  ...props
}: TextProps) {
  const { colors, typography } = useTheme();

  const baseStyle = useMemo<TextStyle>(
    () => (inline
      ? { color: color ?? (tone === 'default' ? undefined : toneColor(tone, colors)) }
      : { ...typography.variants[variant], color: color ?? toneColor(tone, colors), textAlign: align }),
    [inline, typography.variants, variant, color, tone, colors, align],
  );

  return <RNText style={[baseStyle, style]} {...props} />;
});
