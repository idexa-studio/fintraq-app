import { useFontScale, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import type { TypeVariant } from '@/design/tokens/typography';
import React from 'react';
import { Text as RNText } from 'react-native';
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
  return (
    <RNText
      {...rest}
      allowFontScaling={false}
      style={[
        type,
        { fontSize: type.fontSize * scale, lineHeight: type.lineHeight * scale },
        { color: toneColor(tone, theme) },
        align ? { textAlign: align } : null,
        underline ? { textDecorationLine: 'underline' } : null,
        style,
      ]}
    />
  );
}
