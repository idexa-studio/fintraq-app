import { Icon } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { View } from 'react-native';

export type DeltaProps = {
  /** Which way the figure moved. */
  direction: 'up' | 'down' | 'flat';
  /** The change in words, e.g. "8% less than September". */
  label: string;
  /** Whether the move is welcome. Spending going down is good; income going down is not. */
  good?: boolean;
};

/** How a figure changed against the period before: an arrow and a few words. Colour says whether it is welcome, the arrow which way. */
export function Delta({ direction, label, good }: DeltaProps) {
  const { colors, size, space } = useTheme();
  const tone = good === undefined || direction === 'flat' ? 'muted' : good ? 'positive' : 'danger';
  const ink = tone === 'muted' ? colors.textMuted : tone === 'positive' ? colors.positive : colors.danger;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }} accessible accessibilityLabel={label}>
      {direction === 'flat' ? null : <Icon name={direction === 'up' ? 'trend-up' : 'trend-down'} size={size.iconSmall} color={ink} />}
      <Text variant="calloutStrong" tone={tone} style={{ flexShrink: 1 }}>{label}</Text>
    </View>
  );
}
