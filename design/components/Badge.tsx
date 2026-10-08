import { Text } from '@/design/components/Text';
import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { View } from 'react-native';

export type BadgeProps = {
  label: string;
  /** accent: new or good. neutral: a plain status. danger: needs attention. */
  tone?: 'accent' | 'neutral' | 'danger';
};

/** A small capitalised pill, e.g. NEW. */
export function Badge({ label, tone = 'accent' }: BadgeProps) {
  const { colors, size, space, radius } = useTheme();
  const fill = tone === 'accent' ? colors.accent : tone === 'danger' ? colors.danger : colors.divider;
  const content = tone === 'accent' ? colors.onAccent : tone === 'danger' ? colors.onDanger : colors.text;
  return (
    <View style={{ height: size.badge, paddingHorizontal: space.sm + space.xxs, borderRadius: radius.pill, backgroundColor: fill, alignSelf: 'flex-start', justifyContent: 'center' }}>
      <Text variant="badge" style={{ color: content }}>{label}</Text>
    </View>
  );
}
