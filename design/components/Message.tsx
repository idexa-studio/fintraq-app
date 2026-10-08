import { Text } from '@/design/components/Text';
import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { View } from 'react-native';

export type MessageProps = {
  /** An illustration or a large line icon above the headline. */
  illustration?: React.ReactNode;
  title: string;
  body?: string;
  /** Anything that belongs with the message, e.g. a Checklist. Buttons go in the Screen footer. */
  children?: React.ReactNode;
};

/**
 * A centred statement: picture, serif headline, a sentence or two. Used for a
 * step that asks for one thing, for an empty list, and for a result.
 */
export function Message({ illustration, title, body, children }: MessageProps) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.xl, alignSelf: 'stretch' }}>
      <View style={{ alignItems: 'center', gap: space.md, paddingHorizontal: space.lg }}>
        {illustration ? <View style={{ marginBottom: space.lg }}>{illustration}</View> : null}
        <Text variant="display" align="center" accessibilityRole="header">{title}</Text>
        {body ? <Text variant="lead" align="center">{body}</Text> : null}
      </View>
      {children}
    </View>
  );
}
