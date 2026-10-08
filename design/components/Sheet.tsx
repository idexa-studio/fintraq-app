import { Header } from '@/design/components/Header';
import { SheetFrame } from '@/design/components/SheetFrame';
import { useKeyboardOverlap } from '@/design/components/useKeyboardOverlap';
import { useStyles } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SheetPanelProps = {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  /** Pinned under the content: the sheet's buttons. */
  footer?: React.ReactNode;
};

/**
 * The sheet itself, white throughout. A sheet is small and holds one thing, so
 * its list or grid sits directly on it: a card inside would be a box in a box.
 * Use Sheet to present it.
 */
export function SheetPanel({ title, onClose, children, footer }: SheetPanelProps) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.panel} accessibilityViewIsModal>
      <Header task title={title} onClose={onClose} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

export type SheetProps = SheetPanelProps & {
  visible: boolean;
  onClose: () => void;
};

/**
 * A task that rises over the current screen: choose, fill in, confirm. It is only as tall as
 * what it holds, on both platforms. (iOS's own page sheet always fills the height, which left a
 * short list at the top of an empty page.)
 */
export function Sheet({ visible, onClose, ...panel }: SheetProps) {
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();
  // A sheet with a search field rises with the keyboard; otherwise the keyboard would cover it.
  const keyboard = useKeyboardOverlap(visible);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={[styles.scrim, { paddingBottom: keyboard }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        <SheetFrame hug>
          <View style={{ paddingBottom: insets.bottom, flexShrink: 1 }}>
            <SheetPanel onClose={onClose} {...panel} />
          </View>
        </SheetFrame>
      </View>
    </Modal>
  );
}

const createStyles = ({ colors, size, space }: Theme) =>
  StyleSheet.create({
    scrim: { flex: 1, backgroundColor: colors.scrim },
    panel: { flexShrink: 1, backgroundColor: colors.surface },
    scroll: { flexGrow: 0 },
    content: { padding: size.screenPadding, paddingTop: space.xl, gap: space.xl },
    footer: { paddingHorizontal: size.screenPadding, paddingTop: space.sm, paddingBottom: space.lg, gap: space.lg },
  });
