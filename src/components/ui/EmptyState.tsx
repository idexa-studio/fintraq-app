import { Button } from './Button';
import { IconAvatar } from './IconAvatar';
import { Text } from './Text';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { IconSource } from './Icon';
import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type EmptyStateProps = {
  icon: IconSource;
  title: string;
  description?: string;
  /** Primary recovery action — "Add transaction", "Clear filters". */
  actionLabel?: string;
  onAction?: () => void;
  /**
   * `block` — centred, for a whole screen or list with nothing in it.
   * `inline` — compact row inside a card or section.
   */
  variant?: 'block' | 'inline';
  /** Icon tint. Defaults to `primaryInk` (readable on light layers). */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'block',
  color,
  style,
}: EmptyStateProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const accent = color ?? theme.colors.primaryInk;

  if (variant === 'inline') {
    return (
      <View style={[styles.inline, style]}>
        <IconAvatar icon={icon} color={accent} size={40} />
        <View style={styles.inlineBody}>
          <Text variant="calloutStrong">{title}</Text>
          {description ? <Text variant="caption" tone="muted">{description}</Text> : null}
        </View>
        {actionLabel && onAction ? (
          <Button title={actionLabel} onPress={onAction} size="sm" variant="tonal" />
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.block, style]}>
      <IconAvatar icon={icon} color={accent} size={64} />
      <View style={styles.blockBody}>
        <Text variant="subheading" align="center">{title}</Text>
        {description ? <Text variant="callout" tone="muted" align="center">{description}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} size="md" />
      ) : null}
    </View>
  );
});

const createStyles = ({ colors, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    block: {
      alignItems: 'center',
      paddingVertical: spacing('10'),
      paddingHorizontal: spacing('7'),
      gap: spacing('4'),
    },
    blockBody: { gap: spacing('1.5'), alignItems: 'center', maxWidth: 300 },
    inline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      padding: spacing('4'),
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
    },
    inlineBody: { flex: 1, gap: spacing('0.5') },
  });
