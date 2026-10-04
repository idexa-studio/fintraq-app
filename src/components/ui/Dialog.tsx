import { Button } from './Button';
import type { IconSource } from './Icon';
import { Icon } from './Icon';
import { Text } from './Text';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import React, { useMemo } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';

export type DialogTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type DialogAction = {
  label: string;
  onPress: () => void;
  /** primary = the recommended action · danger = irreversible · secondary = cancel / alternative */
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
};

type DialogProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  /** Adds a tone-coloured icon badge above the title; the dialog's text then centres under it. */
  icon?: IconSource;
  tone?: DialogTone;
  /** Actions render in order; put the recommended one last so it sits under the thumb. */
  actions: DialogAction[];
  /** Custom body between message and actions (input, options list). */
  children?: React.ReactNode;
  /** Tapping outside closes. Turn off while something is in progress. */
  dismissible?: boolean;
};

// Soft scale-and-fade in; exit is handled by the Modal's fade.
const enter = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.94 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
}).duration(180);

/**
 * The one dialog layout every modal in the app uses: same width, padding,
 * radius, type and button row. Use it through AlertDialog / ConfirmDialog /
 * OptionsDialog / TextInputDialog, or directly for custom bodies.
 */
export function Dialog({
  visible,
  onClose,
  title,
  message,
  icon,
  tone = 'neutral',
  actions,
  children,
  dismissible = true,
}: DialogProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, width), [theme, width]);

  const toneColor = tone === 'neutral' ? theme.colors.primaryInk : theme.colors[tone];
  // Two short labels sit side by side; long labels or 3+ actions stack.
  const stacked = actions.length > 2 || actions.some((a) => a.label.length > 14);
  // An icon makes it an announcement: badge, title and message centre on one axis.
  const centered = Boolean(icon);

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior="padding">
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={dismissible ? onClose : undefined}
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
        />
        {visible ? (
          <Animated.View entering={enter} style={styles.card} accessibilityViewIsModal>
            {icon ? (
              <View style={[styles.halo, { backgroundColor: theme.alpha(toneColor, 'subtle') }]}>
                <View style={[styles.badge, { backgroundColor: theme.alpha(toneColor, 'soft') }]}>
                  <Icon name={icon} size={24} color={toneColor} weight="bold" />
                </View>
              </View>
            ) : null}

            <View style={[styles.text, centered && styles.textCentered]}>
              <Text variant="headline" align={centered ? 'center' : undefined} accessibilityRole="header">
                {title}
              </Text>
              {message ? (
                <Text variant="callout" tone="muted" align={centered ? 'center' : undefined}>
                  {message}
                </Text>
              ) : null}
            </View>

            {children}

            <View style={[styles.actions, stacked && styles.actionsStacked]}>
              {actions.map((a) => (
                <Button
                  key={a.label}
                  title={a.label}
                  onPress={a.onPress}
                  isLoading={a.loading}
                  disabled={a.disabled}
                  variant={a.variant === 'danger' ? 'danger' : a.variant === 'secondary' ? 'secondary' : 'primary'}
                  style={[stacked ? styles.buttonStacked : styles.buttonRow, a.variant === 'secondary' && styles.secondary]}
                />
              ))}
            </View>
          </Animated.View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const HALO = 72;
const BADGE = 52;

const createStyles = ({ colors, overlay, spacing, radius }: ThemeContextType, width: number) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: overlay.dim,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing('6'),
    },
    card: {
      width: Math.min(width - spacing('6') * 2, 340),
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      paddingHorizontal: spacing('5'),
      paddingTop: spacing('6'),
      paddingBottom: spacing('5'),
      gap: spacing('4'),
    },
    halo: {
      width: HALO,
      height: HALO,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    badge: {
      width: BADGE,
      height: BADGE,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { gap: spacing('1.5') },
    textCentered: { alignItems: 'center', paddingHorizontal: spacing('1') },
    actions: { flexDirection: 'row', gap: spacing('2'), marginTop: spacing('2') },
    actionsStacked: { flexDirection: 'column-reverse' },
    buttonRow: { flex: 1, minWidth: 0 },
    buttonStacked: { alignSelf: 'stretch' },
    // Paper-tone fill so Cancel stays visible on the white card.
    secondary: { backgroundColor: colors.card },
  });
