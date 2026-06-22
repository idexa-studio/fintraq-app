import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';
import { BentoPressable } from './BentoPressable';

type ConfirmDialogProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isLoading?: boolean;
};

export const ConfirmDialog = React.memo(function ConfirmDialog({
  visible,
  onClose,
  title,
  message,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  isLoading = false,
}: ConfirmDialogProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleConfirm = useCallback(() => {
    onClose();
    onConfirm();
  }, [onClose, onConfirm]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.body}>
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>

          <View style={styles.actions}>
            <BentoPressable style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>{cancelLabel}</Text>
            </BentoPressable>

            <BentoPressable
              style={[styles.btnConfirm, destructive && styles.btnDanger]}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={styles.btnConfirmText}>{confirmLabel}</Text>
              )}
            </BentoPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const createStyles = ({ colors, overlay, typography, spacing, radius, layout, sizes }: ThemeContextType) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: overlay.dim,
      justifyContent: 'center',
      padding: spacing('7'),
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      overflow: 'hidden',
      padding: spacing('6'),
      gap: spacing('4'),
    },
    body: {
      padding: 0,
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.xl,
      color: colors.text,
      marginBottom: spacing('2'),
    },
    message: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.md,
      color: colors.textMuted,
      lineHeight: 20,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing('2'),
      marginTop: spacing('4'),
    },
    btnCancel: {
      height: sizes.button.md.height,
      paddingHorizontal: spacing('4'),
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radius('lg'),
    },
    btnCancelText: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.md,
      color: colors.textMuted,
    },
    btnConfirm: {
      height: sizes.button.md.height,
      paddingHorizontal: spacing('5'),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radius('lg'),
    },
    btnDanger: {
      backgroundColor: colors.danger,
    },
    btnConfirmText: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.md,
      color: colors.primaryForeground,
    },
  });
