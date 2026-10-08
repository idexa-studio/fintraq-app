import { Button } from '@/design/components/Button';
import { Card } from '@/design/components/Card';
import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { Emblem } from '@/design/components/Emblem';
import { IllustrationTile } from '@/design/components/IllustrationTile';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import { INK } from '@/design/tokens/colors';
import type { PastelName } from '@/design/tokens/colors';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type EmptyStateProps = {
  icon: IconName;
  /** The pastel behind the icon. Use the colour the subject has elsewhere in the app. */
  color?: PastelName;
  /** What will be here, not that nothing is. */
  title: string;
  body?: string;
  /** The first step. */
  actionLabel?: string;
  onAction?: () => void;
  /**
   * For one empty section among others on a screen: a single quiet card with
   * a link, so the screen keeps its shape. The full version, for a screen or
   * list that is empty as a whole, is set on the page with a button.
   */
  compact?: boolean;
};

/** What a list or section shows before it has anything: a picture, a promise, and the first step. */
export function EmptyState({ icon, color = 'lilac', title, body, actionLabel, onAction, compact = false }: EmptyStateProps) {
  const { size } = useTheme();
  const styles = useStyles(createStyles);

  if (compact) {
    return (
      <Card style={styles.compact}>
        <IllustrationTile color={color}><Icon name={icon} size={size.iconLarge} color={INK} /></IllustrationTile>
        <View style={styles.compactText}>
          <Text variant="bodyStrong">{title}</Text>
          {body ? <Text variant="callout" tone="muted">{body}</Text> : null}
          {actionLabel ? (
            <Touchable onPress={onAction} accessibilityLabel={actionLabel} hitSlop={size.titleGap} style={styles.link}>
              <Text variant="calloutStrong" underline>{actionLabel}</Text>
            </Touchable>
          ) : null}
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.full}>
      <Emblem icon={icon} color={color} />
      <View style={styles.fullText}>
        <Text variant="display" align="center" accessibilityRole="header">{title}</Text>
        {body ? <Text variant="body" tone="muted" align="center">{body}</Text> : null}
      </View>
      {actionLabel ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    compact: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
    compactText: { flex: 1, gap: space.xs },
    link: { alignSelf: 'flex-start', marginTop: space.xs },
    full: { alignItems: 'center', gap: space.xl, paddingVertical: space.xxl },
    fullText: { gap: space.sm, paddingHorizontal: space.lg },
  });
