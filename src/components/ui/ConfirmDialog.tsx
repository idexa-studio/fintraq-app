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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

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

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
      paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing('9'),
    },
    card: {
      alignSelf: 'stretch',
      backgroundColor: colors.background,
      borderRadius: radius('2xl'),
      padding: spacing('5'),
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: 18,
      color: colors.text,
      marginBottom: spacing('2'),
    },
    message: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: spacing('5'),
    },
    actions: {
      flexDirection: 'row',
      gap: spacing('2.5'),
    },
    btnCancel: {
      flex: 1,
      height: 44,
      borderRadius: radius('md'),
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    btnCancelText: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
    btnConfirm: {
      flex: 1,
      height: 44,
      borderRadius: radius('md'),
      backgroundColor: colors.text,
      justifyContent: 'center',
      alignItems: 'center',
    },
    btnDanger: {
      backgroundColor: colors.danger,
    },
    btnConfirmText: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.sm,
      color: colors.background,
    },
  });
