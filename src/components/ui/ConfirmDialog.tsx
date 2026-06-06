import React, { useMemo, useCallback } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';

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
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.body}>
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.btnCancelText}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnConfirm, destructive && styles.btnDanger]}
              onPress={handleConfirm}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={styles.btnConfirmText}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const createStyles = ({ colors, overlay, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: overlay.dim,
      justifyContent: 'center',
      padding: spacing('7'),
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 28,
      overflow: 'hidden',
      padding: spacing('6'),
      gap: spacing('4'),
    },
    body: {
      padding: 0,
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: 24,
      color: colors.text,
      marginBottom: spacing('2'),
    },
    message: {
      fontFamily: typography.fonts.regular,
      fontSize: 14,
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
      height: 40,
      paddingHorizontal: spacing('4'),
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radius('full'),
    },
    btnCancelText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 14,
      color: colors.textMuted,
    },
    btnConfirm: {
      height: 40,
      paddingHorizontal: spacing('5'),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radius('full'),
    },
    btnDanger: {
      backgroundColor: colors.danger,
    },
    btnConfirmText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 14,
      color: colors.background,
    },
  });
