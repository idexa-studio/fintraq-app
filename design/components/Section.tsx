import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { View } from 'react-native';

export type SectionProps = {
  title: string;
  /** One small line under the title saying what the section shows or how to use it. */
  hint?: string;
  /** A quiet link at the end of the title line, e.g. "See all". */
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
};

/** A bold title and the content it names. */
export function Section({ title, hint, actionLabel, onAction, children }: SectionProps) {
  const { size, space } = useTheme();
  return (
    <View style={{ gap: size.titleGap }}>
      <View style={{ gap: space.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.lg }}>
          <Text variant="title" accessibilityRole="header" style={{ flex: 1 }}>{title}</Text>
          {actionLabel ? (
            <Touchable onPress={onAction} accessibilityRole="link" accessibilityLabel={`${actionLabel}, ${title}`} hitSlop={space.lg}>
              <Text variant="calloutStrong" underline>{actionLabel}</Text>
            </Touchable>
          ) : null}
        </View>
        {hint ? <Text variant="callout" tone="muted">{hint}</Text> : null}
      </View>
      {/* Sibling cards in one section sit a card gap apart; unrelated blocks belong in separate sections. */}
      <View style={{ gap: size.cardGap }}>{children}</View>
    </View>
  );
}
