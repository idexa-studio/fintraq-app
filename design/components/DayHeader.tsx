import { Text } from '@/design/components/Text';
import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { View } from 'react-native';

export type DayHeaderProps = {
  /** "Today", "Yesterday", or a date. */
  label: string;
  /** The day's net, already formatted. */
  value?: string;
};

/** Heads a day's transactions in a list grouped by date. */
export function DayHeader({ label, value }: DayHeaderProps) {
  const { space } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.lg }} accessibilityRole="header">
      <Text variant="bodyStrong">{label}</Text>
      {value ? <Text variant="callout" tone="muted">{value}</Text> : null}
    </View>
  );
}
