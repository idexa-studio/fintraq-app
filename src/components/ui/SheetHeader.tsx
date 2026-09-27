import { Text } from './Text';
import { useTheme } from '@/src/providers/ThemeProvider';
import React from 'react';
import { View } from 'react-native';

type SheetHeaderProps = {
  title: string;
  /** One line of context: the current selection, a count, a hint. */
  subtitle?: string;
  /** Preview of the current value (swatch, icon tile) or an action. */
  trailing?: React.ReactNode;
};

/** Standard header for bottom sheets and pickers — same spacing and type everywhere. */
export const SheetHeader = React.memo(function SheetHeader({ title, subtitle, trailing }: SheetHeaderProps) {
  const { spacing, layout } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing('3'),
        paddingHorizontal: layout.screenPadding,
        paddingTop: spacing('3'),
        paddingBottom: spacing('3'),
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="headline" accessibilityRole="header" numberOfLines={1}>{title}</Text>
        {subtitle ? <Text variant="caption" tone="muted" numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </View>
  );
});
