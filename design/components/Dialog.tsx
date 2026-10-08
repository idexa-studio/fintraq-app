import { Spinner } from '@/design/components/Spinner';
import { Text } from '@/design/components/Text';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

export type DialogPanelProps = {
  title: string;
  body?: string;
  /** Buttons, stacked: the confirming one first. */
  children?: React.ReactNode;
};

/** The dialog box itself: grey title band over a white body. Use Dialog to present it. */
export function DialogPanel({ title, body, children }: DialogPanelProps) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.panel} accessibilityViewIsModal>
      <View style={styles.head}>
        <Text variant="title" align="center" accessibilityRole="header">{title}</Text>
      </View>
      <View style={styles.body}>
        {body ? <Text variant="body" align="center">{body}</Text> : null}
        {children}
      </View>
    </View>
  );
}

export type DialogProps = DialogPanelProps & {
  visible: boolean;
  /** Called for the Android back button. Omit to make the dialog blocking. */
  onRequestClose?: () => void;
};

/** A question or a result that must be answered before going on. The title is the question. */
export function Dialog({ visible, onRequestClose, ...panel }: DialogProps) {
  const styles = useStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onRequestClose}>
      <View style={styles.scrim}>
        <DialogPanel {...panel} />
      </View>
    </Modal>
  );
}

export type LoadingDialogProps = {
  visible: boolean;
  title: string;
};

/** Blocks the screen while something that cannot be interrupted finishes. */
export function LoadingDialog({ visible, title }: LoadingDialogProps) {
  const { space } = useTheme();
  return (
    <Dialog visible={visible} title={title}>
      <View style={{ alignItems: 'center', paddingVertical: space.sm }}>
        <Spinner icon="lock" accessibilityLabel={title} />
      </View>
    </Dialog>
  );
}

const createStyles = ({ colors, radius, size, space }: Theme) =>
  StyleSheet.create({
    scrim: { flex: 1, backgroundColor: colors.scrim, alignItems: 'stretch', justifyContent: 'center', paddingHorizontal: size.dialogMargin },
    panel: { borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.surface },
    head: { minHeight: size.cardAction, justifyContent: 'center', paddingHorizontal: size.cardPadding, paddingVertical: space.md, backgroundColor: colors.background },
    body: { padding: space.xl, gap: space.lg },
  });
