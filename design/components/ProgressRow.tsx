import { ProgressBar } from '@/design/components/ProgressBar';
import { Text } from '@/design/components/Text';
import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { View } from 'react-native';

export type ProgressRowProps = {
  /** What is happening, e.g. "Backing up". */
  title: string;
  /** Where it has got to, e.g. "Uploading 2 of 3". */
  detail?: string;
  /** 0 to 1, or leave out while it cannot be known. */
  value?: number;
};

/** Long-running work shown in place: what it is, how far along, and a bar. */
export function ProgressRow({ title, detail, value }: ProgressRowProps) {
  const { space, size } = useTheme();
  return (
    <View style={{ gap: space.sm, paddingHorizontal: size.cardPadding, paddingVertical: space.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.lg }}>
        <Text variant="bodyStrong" style={{ flex: 1 }}>{title}</Text>
        {value !== undefined ? <Text variant="callout" tone="muted">{`${Math.round(value * 100)}%`}</Text> : null}
      </View>
      <ProgressBar value={value} accessibilityLabel={title} />
      {detail ? <Text variant="callout" tone="muted">{detail}</Text> : null}
    </View>
  );
}
