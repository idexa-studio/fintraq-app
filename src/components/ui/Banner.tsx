import { BentoPressable } from './BentoPressable';
import { Text } from './Text';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { IconSource } from './Icon';
import { Icon } from './Icon';
import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

type BannerProps = {
  tone?: BannerTone;
  title: string;
  message?: string;
  /** Overrides the tone's default icon. */
  icon?: IconSource;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
};

const TONE_ICON: Record<BannerTone, IconSource> = {
  info: 'info',
  success: 'check-circle',
  warning: 'warning',
  danger: 'warning-circle',
};

/** Inline, persistent message inside a screen. For blocking decisions use ConfirmDialog. */
export const Banner = React.memo(function Banner({
  tone = 'info',
  title,
  message,
  icon,
  actionLabel,
  onAction,
  onDismiss,
  style,
}: BannerProps) {
  const theme = useTheme();
  const { colors, alpha } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const color = colors[tone];

  return (
    <View
      accessibilityRole={tone === 'danger' || tone === 'warning' ? 'alert' : undefined}
      style={[styles.container, { backgroundColor: alpha(color, 'subtle') }, style]}
    >
      <Icon name={icon ?? TONE_ICON[tone]} size={20} color={color} weight="fill" />
      <View style={styles.body}>
        <Text variant="calloutStrong">{title}</Text>
        {message ? <Text variant="caption" tone="muted">{message}</Text> : null}
        {actionLabel && onAction ? (
          <BentoPressable onPress={onAction} style={styles.action} accessibilityRole="button" hitSlop={8}>
            <Text variant="calloutStrong" color={color}>{actionLabel}</Text>
          </BentoPressable>
        ) : null}
      </View>
      {onDismiss ? (
        <BentoPressable onPress={onDismiss} hitSlop={12} accessibilityRole="button" accessibilityLabel="Dismiss" style={styles.dismiss}>
          <Icon name="x" size={16} color={colors.textMuted} weight="bold" />
        </BentoPressable>
      ) : null}
    </View>
  );
});

const createStyles = ({ spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing('3'),
      padding: spacing('3.5'),
      borderRadius: radius('xl'),
    },
    body: { flex: 1, gap: spacing('0.5') },
    action: { alignSelf: 'flex-start', marginTop: spacing('1.5'), borderRadius: radius('full') },
    dismiss: { borderRadius: radius('full'), padding: 2 },
  });
