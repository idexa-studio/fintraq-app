import { Money } from '@/design/components/Money';
import { Text } from '@/design/components/Text';
import type { TextTone } from '@/design/components/Text';
import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { View } from 'react-native';

export type StatProps = {
  label: string;
  /** A formatted amount. */
  value: string;
  tone?: TextTone;
  /** The screen's headline figure rather than one of several. */
  hero?: boolean;
};

/** A labelled figure. */
export function Stat({ label, value, tone = 'default', hero = false }: StatProps) {
  const { space } = useTheme();
  return (
    <View style={{ flex: 1, gap: space.xs }} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text variant="callout" tone="muted" numberOfLines={2}>{label}</Text>
      <Money value={value} variant={hero ? 'amountHero' : 'amountLarge'} tone={tone} />
    </View>
  );
}
