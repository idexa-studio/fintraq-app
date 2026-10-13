import { useFontScale, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import type { TypeVariant } from '@/design/tokens/typography';
import React from 'react';
import { Platform, Text as RNText } from 'react-native';
import type { TextProps as RNTextProps } from 'react-native';

export type TextTone = 'default' | 'muted' | 'onAction' | 'onAccent' | 'disabled' | 'positive' | 'selected' | 'danger' | 'warning';

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
  underline?: boolean;
};

const toneColor = (tone: TextTone, { colors }: Theme): string => {
  switch (tone) {
    case 'muted': return colors.textMuted;
    case 'onAction': return colors.onAction;
    case 'onAccent': return colors.onAccent;
    case 'disabled': return colors.onDisabled;
    case 'positive': return colors.positive;
    case 'selected': return colors.selected;
    case 'danger': return colors.danger;
    case 'warning': return colors.warning;
    default: return colors.text;
  }
};

/** All text. A variant fixes family, size, leading and tracking together. */
export function Text({ variant = 'body', tone = 'default', align, underline, style, ...rest }: TextProps) {
  const theme = useTheme();
  const scale = useFontScale();
  const type = theme.type[variant];
  // iOS, shrinking a text to fit, also checks that its line fits the height it was given, and the
  // line's height does not shrink with the font. Rows separated by hairlines sit at fractions of a
  // point, so a text's box is sometimes rounded to a hair under its line height; then no size
  // "fits" and iOS draws it at its smallest, 4pt ("CDF" in the currency list, an amount in
  // Activity). A point of headroom keeps the box at least a line tall however it is rounded.
  const headroom = Platform.OS === 'ios' && rest.adjustsFontSizeToFit ? { minHeight: type.lineHeight * scale + 1 } : null;
  return (
    <RNText
      {...rest}
      allowFontScaling={false}
      style={[
        type,
        { fontSize: type.fontSize * scale, lineHeight: type.lineHeight * scale },
        headroom,
        { color: toneColor(tone, theme) },
        align ? { textAlign: align } : null,
        underline ? { textDecorationLine: 'underline' } : null,
        style,
      ]}
    />
  );
}
