import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastContent = {
  message: string;
  /** One action, usually Undo. */
  actionLabel?: string;
  onAction?: () => void;
};

/** The bar itself. Use `useToast().show(...)` to present one. */
export function Toast({ message, actionLabel, onAction }: ToastContent) {
  const styles = useStyles(createStyles);
  return (
    // Announced when it appears, but not grouped into one element: Undo must stay reachable on its own.
    <View style={styles.toast} accessibilityLiveRegion="polite">
      <Text variant="callout" tone="onAction" style={styles.message}>{message}</Text>
      {actionLabel ? (
        <Touchable onPress={onAction} accessibilityLabel={actionLabel} hitSlop={styles.hit.padding}>
          <Text variant="calloutStrong" tone="onAction" underline>{actionLabel}</Text>
        </Touchable>
      ) : null}
    </View>
  );
}

type ToastApi = { show: (toast: ToastContent) => void; hide: () => void };

const ToastContext = createContext<ToastApi>({ show: () => {}, hide: () => {} });

/** Shows a brief confirmation at the foot of the screen, e.g. after saving, with a way to undo. */
export const useToast = () => useContext(ToastContext);

/** How long a toast stays, in ms. Long enough to read a sentence and reach Undo. */
const STAY = 5000;

export type ToastProviderProps = {
  children: React.ReactNode;
  /** How far above the bottom edge the toast sits. Defaults to the height of the tab bar, so it never covers it. */
  bottomOffset?: number;
};

/** Mount once near the root. One toast at a time; a new one replaces the old. */
export function ToastProvider({ children, bottomOffset }: ToastProviderProps) {
  const { motion, size } = useTheme();
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<(ToastContent & { id: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const count = useRef(0);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((content: ToastContent) => {
    clearTimeout(timer.current);
    count.current += 1;
    setToast({ ...content, id: count.current });
    timer.current = setTimeout(() => setToast(null), STAY);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const api = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={FadeInDown.duration(motion.normal)}
          exiting={FadeOutDown.duration(motion.fast)}
          pointerEvents="box-none"
          style={[styles.host, { bottom: insets.bottom + (bottomOffset ?? size.tabBar) }]}
        >
          <Toast message={toast.message} actionLabel={toast.actionLabel} onAction={() => { toast.onAction?.(); hide(); }} />
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const createStyles = ({ colors, radius, size, space }: Theme) =>
  StyleSheet.create({
    host: { position: 'absolute', left: 0, right: 0, padding: size.screenPadding },
    toast: { minHeight: size.button, borderRadius: radius.md, backgroundColor: colors.action, flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingHorizontal: size.cardPadding, paddingVertical: space.md },
    message: { flex: 1 },
    hit: { padding: space.md },
  });
