import React, { useMemo, useCallback } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
  type?: 'info' | 'success' | 'error' | 'warning';
};

const ICONS = {
  info: { name: 'information' as const, bg: '#60A5FA15', fg: '#60A5FA' },
  success: { name: 'check-circle' as const, bg: '#0E9F6E15', fg: '#0E9F6E' },
  error: { name: 'alert-circle' as const, bg: '#B4231815', fg: '#B42318' },
  warning: { name: 'alert' as const, bg: '#F59E0B15', fg: '#F59E0B' },
} as const;

export const AlertDialog = React.memo(function AlertDialog({
  visible,
  title,
  message,
  buttons = [{ text: 'Ok', style: 'default' }],
  onClose,
  type = 'info',
}: AlertDialogProps) {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, screenWidth), [theme, screenWidth]);

  const iconCfg = ICONS[type];

  const handleButtonPress = useCallback((button: AlertButton) => {
    if (button.onPress) button.onPress();
    onClose();
  }, [onClose]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.body}>
            <View style={[styles.iconBox, { backgroundColor: iconCfg.bg }]}>
              <MaterialCommunityIcons name={iconCfg.name} size={24} color={iconCfg.fg} />
            </View>

            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>

          <View style={styles.actions}>
            {buttons.map((btn, i) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.btn}
                  onPress={() => handleButtonPress(btn)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.btnText,
                    isCancel && styles.btnCancelText,
                    isDestructive && styles.btnDangerText,
                    !isCancel && !isDestructive && styles.btnPrimaryText
                  ]}>
                    {btn.text}
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

const createStyles = ({ colors, overlay, typography, spacing, radius }: ThemeContextType, screenWidth: number) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: overlay.dim,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing('6'),
    },
    card: {
      width: Math.min(screenWidth - spacing('12'), 320),
      backgroundColor: colors.surface,
      borderRadius: 28,
      overflow: 'hidden',
      padding: spacing('6'),
      gap: spacing('5'),
    },
    body: {
      alignItems: 'flex-start',
      width: '100%',
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: radius('full'),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing('4'),
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: 24,
      color: colors.text,
      textAlign: 'left',
      marginBottom: spacing('2'),
    },
    message: {
      fontFamily: typography.fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
      textAlign: 'left',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      width: '100%',
      gap: spacing('2'),
    },
    btn: {
      height: 40,
      paddingHorizontal: spacing('3'),
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radius('full'),
    },
    btnText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 14,
    },
    btnPrimaryText: {
      color: colors.primary,
    },
    btnCancelText: {
      color: colors.textMuted,
    },
    btnDangerText: {
      color: colors.danger,
    },
  });
