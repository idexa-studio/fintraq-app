import { Card } from '@/design/components/Card';
import { CheckMark } from '@/design/components/StepRow';
import { Text } from '@/design/components/Text';
import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { View } from 'react-native';

export type ChecklistProps = {
  items: string[];
};

/** A short list of things to do or know before the next step, each with a tick. */
export function Checklist({ items }: ChecklistProps) {
  const { space, size } = useTheme();
  return (
    <Card style={{ gap: space.xl, paddingHorizontal: size.cardPadding + space.xs, paddingVertical: space.xl }}>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
          <CheckMark size={size.iconSmall - 2} />
          <Text variant="callout" style={{ flex: 1 }}>{item}</Text>
        </View>
      ))}
    </Card>
  );
}
