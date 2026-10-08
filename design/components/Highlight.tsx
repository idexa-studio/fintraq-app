import { Card } from '@/design/components/Card';
import type { IconName } from '@/design/components/Icon';
import { IconCircle } from '@/design/components/IconCircle';
import type { IconCircleProps } from '@/design/components/IconCircle';
import { Text } from '@/design/components/Text';
import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { View } from 'react-native';

export type HighlightProps = {
  icon: IconName;
  color?: IconCircleProps['color'];
  /** The finding, as one short sentence. Set in the serif. */
  statement: string;
  /** The figure or comparison that backs it up. */
  detail?: string;
  onPress?: () => void;
};

/** A finding worth stopping for: a coloured mark, a serif sentence and the number behind it, on a white card. */
export function Highlight({ icon, color = 'green', statement, detail, onPress }: HighlightProps) {
  const { space } = useTheme();
  return (
    <Card onPress={onPress} accessibilityLabel={detail ? `${statement}. ${detail}` : statement} style={{ flexDirection: 'row', gap: space.lg }}>
      <IconCircle icon={icon} color={color} />
      <View style={{ flex: 1, gap: space.xs }}>
        <Text variant="title">{statement}</Text>
        {detail ? <Text variant="callout" tone="muted">{detail}</Text> : null}
      </View>
    </Card>
  );
}
