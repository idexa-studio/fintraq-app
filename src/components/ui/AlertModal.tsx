import React, { useMemo, useCallback } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
  type?: 'info' | 'success' | 'error' | 'warning';
};

export const AlertModal = React.memo(function AlertModal({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onClose,
  type = 'info',
}: AlertModalProps) {
  const theme = useTheme();
  const { colors } = theme;
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, width), [theme, width]);

  const icon = useMemo(() => {
    switch (type) {
      case 'success': return { name: 'checkmark-circle' as const, color: colors.primary };
      case 'error': return { name: 'alert-circle' as const, color: colors.danger };
      case 'warning': return { name: 'warning' as const, color: colors.warning };
      case 'info':
      default: return { name: 'information-circle' as const, color: colors.info };
    }
  }, [type, colors.primary, colors.danger, colors.warning, colors.info]);

  const handleButtonPress = useCallback((button: AlertButton) => {
    if (button.onPress) button.onPress();
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
              <Ionicons name={icon.name} size={28} color={icon.color} />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>
          
          {message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isCancel ? styles.cancelButton : styles.primaryButton,
                    isDestructive && { backgroundColor: colors.danger },
                    buttons.length > 2 ? { width: '100%' } : { flex: 1 }
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text style={[
                    styles.buttonText,
                    isCancel && { color: colors.text }
                  ]}>
                    {button.text.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
});

const createStyles = ({ colors, isDark, overlay, typography }: ThemeContextType, width: number) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: overlay.dark,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    content: {
      width: Math.min(width - 48, 340),
      backgroundColor: colors.background,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      alignItems: 'flex-start',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 20,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      flex: 1,
      fontFamily: typography.fonts.heading,
      fontSize: 22,
      color: colors.text,
      letterSpacing: -1,
    },
    message: {
      fontFamily: typography.fonts.regular,
      fontSize: 15,
      color: colors.textMuted,
      lineHeight: 22,
      marginBottom: 32,
    },
    buttonContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      width: '100%',
    },
    button: {
      height: 56,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: colors.text,
    },
    cancelButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonText: {
      fontFamily: typography.fonts.bold,
      fontSize: 13,
      color: colors.background,
      letterSpacing: 1,
    },
  });
