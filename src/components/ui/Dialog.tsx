import { Button } from './Button';
import type { IconSource } from './Icon';
import { IconAvatar } from './IconAvatar';
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
  /** Adds a tone-coloured icon tile above the title. */
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
            {icon ? <IconAvatar icon={icon} color={toneColor} size={48} weight="duotone" /> : null}

            <View style={styles.text}>
              <Text variant="headline" accessibilityRole="header">{title}</Text>
              {message ? <Text variant="body" tone="muted">{message}</Text> : null}
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
      width: Math.min(width - spacing('6') * 2, 360),
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      padding: spacing('6'),
      gap: spacing('5'),
    },
    text: { gap: spacing('2') },
    actions: { flexDirection: 'row', gap: spacing('2.5'), marginTop: spacing('1') },
    actionsStacked: { flexDirection: 'column-reverse' },
    buttonRow: { flex: 1, minWidth: 0 },
    buttonStacked: { alignSelf: 'stretch' },
    // Paper-tone fill so Cancel stays visible on the white card.
    secondary: { backgroundColor: colors.background },
  });
