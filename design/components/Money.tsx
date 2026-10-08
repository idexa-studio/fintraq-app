import { Text } from '@/design/components/Text';
import type { TextTone } from '@/design/components/Text';
import { useFontScale, useTheme } from '@/design/ThemeProvider';
import { MINOR_UNITS_SCALE } from '@/design/tokens/typography';
import React from 'react';

export type MoneyProps = {
  /** An already formatted amount, e.g. "£1,204.50" or "−₹300". Formatting belongs to the caller. */
  value: string;
  variant?: 'amountHero' | 'amountLarge' | 'amount';
  tone?: TextTone;
};

/** Splits "£1,204.50" into "£1,204" and ".50" at the last separator that is followed only by digits. */
const splitMinor = (value: string): [string, string] => {
  const match = /^(.*?)([.,]\d{1,3})(\D*)$/.exec(value);
  // A three-digit tail is a thousands group, not minor units.
  if (!match || match[2].length === 4) return [value, ''];
  return [match[1], match[2] + match[3]];
};

/**
 * An amount. On the large variants the minor units are set smaller, as on the
 * reference balance. An amount too wide for its place shrinks to fit; it is
 * never cut off with an ellipsis, which would show a wrong figure.
 */
export function Money({ value, variant = 'amount', tone = 'default' }: MoneyProps) {
  const { type } = useTheme();
  const scale = useFontScale();
  const [major, minor] = variant === 'amount' ? [value, ''] : splitMinor(value);
  return (
    <Text variant={variant} tone={tone} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} accessibilityLabel={value} style={{ fontVariant: ['tabular-nums'] }}>
      {'\u2066'}
      {major}
      {minor ? <Text variant={variant} tone={tone} style={{ fontSize: Math.round(type[variant].fontSize * MINOR_UNITS_SCALE * scale) }}>{minor}</Text> : null}
      {'\u2069'}
    </Text>
  );
}
