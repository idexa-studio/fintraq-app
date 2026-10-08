import { Card } from '@/design/components/Card';
import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { View } from 'react-native';

export type NoticeProps = {
  title: string;
  body?: string;
  /** info: something to know. positive: it worked. warning: check this. danger: it failed, here is what to do. */
  tone?: 'info' | 'positive' | 'warning' | 'danger';
  linkLabel?: string;
  onLink?: () => void;
};

const TONE_ICON: Record<NonNullable<NoticeProps['tone']>, IconName | null> = {
  info: null,
  positive: 'check-circle',
  warning: 'warning',
  danger: 'warning-circle',
};

/** A note that stays on the page: bold title, a sentence, and at most one link. */
export function Notice({ title, body, tone = 'info', linkLabel, onLink }: NoticeProps) {
  const { colors, space } = useTheme();
  const icon = TONE_ICON[tone];
  const iconColor = tone === 'positive' ? colors.positive : tone === 'warning' ? colors.warning : colors.danger;
  return (
    <Card style={{ flexDirection: 'row', gap: space.md }}>
      {icon ? <Icon name={icon} color={iconColor} /> : null}
      <View style={{ flex: 1, gap: space.xs }}>
        <Text variant="bodyStrong">{title}</Text>
        {body ? <Text variant="callout">{body}</Text> : null}
        {linkLabel ? (
          <Touchable onPress={onLink} accessibilityRole="link" accessibilityLabel={linkLabel} hitSlop={space.sm} style={{ alignSelf: 'flex-start' }}>
            <Text variant="callout" underline>{linkLabel}</Text>
          </Touchable>
        ) : null}
      </View>
    </Card>
  );
}
