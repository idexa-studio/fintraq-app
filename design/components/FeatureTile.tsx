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
  /**
   * The mark beside the action, with the sentence small beneath them: for
   * shortcuts the user already knows, where the full tile would take a third
   * of the screen. Keep the sentence to a few words.
   */
  compact?: boolean;
  /** The action, in bold. */
  label: string;
  onPress?: () => void;
};

/** Half-width tile for a grid of things to explore: coloured icon, quiet sentence, bold action. */
export function FeatureTile({ icon, color, description, label, compact = false, onPress }: FeatureTileProps) {
  const { space } = useTheme();
  if (compact) {
    return (
      <Card onPress={onPress} accessibilityLabel={`${label}. ${description}`} style={{ flex: 1, gap: space.sm, paddingVertical: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <IconCircle icon={icon} color={color} />
          <Text variant="bodyStrong" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={{ flex: 1 }}>{label}</Text>
        </View>
        {/* Under the mark, across the whole tile, so the few words are never cut short. */}
        <Text variant="caption" tone="muted" numberOfLines={2}>{description}</Text>
      </Card>
    );
  }
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
