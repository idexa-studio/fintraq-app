import { Badge } from '@/design/components/Badge';
import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type LockedCardProps = {
  /** The plan that unlocks it, e.g. "Pro". */
  badge: string;
  title: string;
  body?: string;
  /** What is behind the lock, named plainly. A handful at most. */
  items?: { icon: IconName; title: string; /** One line on what it does, so a name alone is never the whole offer. */ detail?: string }[];
  actionLabel: string;
  onAction?: () => void;
};

/**
 * Stands in for everything a plan would add to a screen: one card, what you
 * would get, and one way in. Never one lock per item.
 */
export function LockedCard({ badge, title, body, items = [], actionLabel, onAction }: LockedCardProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <Card style={styles.card}>
      <Badge label={badge} />
      <View style={styles.text}>
        <Text variant="bodyStrong">{title}</Text>
        {body ? <Text variant="callout" tone="muted">{body}</Text> : null}
      </View>
      {items.length ? (
        <View style={styles.items}>
          {items.map((item) => (
            <View key={item.title} style={styles.item}>
              <Icon name={item.icon} color={colors.textMuted} />
              <View style={styles.itemText}>
                <Text variant="body">{item.title}</Text>
                {item.detail ? <Text variant="callout" tone="muted">{item.detail}</Text> : null}
              </View>
              <Icon name="lock" size={styles.lock.width} color={colors.textMuted} />
            </View>
          ))}
        </View>
      ) : null}
      <Button label={actionLabel} onPress={onAction} />
    </Card>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    card: { gap: space.lg },
    text: { gap: space.xs },
    items: { gap: space.md },
    item: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    itemText: { flex: 1, gap: space.xxs },
    lock: { width: size.iconSmall },
  });
