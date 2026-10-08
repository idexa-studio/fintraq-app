import { Card } from '@/design/components/Card';
import { IconCircle } from '@/design/components/IconCircle';
import type { IconCircleProps } from '@/design/components/IconCircle';
import type { IconName } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { View } from 'react-native';

export type FeatureTileProps = {
  icon: IconName;
  color?: IconCircleProps['color'];
  /** What it does for you, in a sentence. */
  description: string;
  /** The action, in bold. */
  label: string;
  onPress?: () => void;
};

/** Half-width tile for a grid of things to explore: coloured icon, quiet sentence, bold action. */
export function FeatureTile({ icon, color, description, label, onPress }: FeatureTileProps) {
  const { space } = useTheme();
  return (
    <Card onPress={onPress} accessibilityLabel={`${label}. ${description}`} style={{ flex: 1, gap: space.xl }}>
      <IconCircle icon={icon} color={color} />
      <View style={{ flex: 1, justifyContent: 'space-between', gap: space.lg }}>
        <Text variant="body" tone="muted">{description}</Text>
        <Text variant="bodyStrong">{label}</Text>
      </View>
    </Card>
  );
}
