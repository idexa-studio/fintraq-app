import { AlertCircleIcon, CheckmarkCircle01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useMemo, useCallback } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';
import { BentoPressable } from './BentoPressable';

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

export const AlertDialog = React.memo(function AlertDialog({
  visible,
  title,
  message,
  buttons = [{ text: 'Ok', style: 'default' }],
  onClose,
  type = 'info',
}: AlertDialogProps) {
  const theme = useTheme();
  const { colors } = theme;
  const { width: screenWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, screenWidth), [theme, screenWidth]);

  const isVertical = useMemo(() => {
    if (buttons.length > 2) return true;
    const totalLength = buttons.reduce((acc, b) => acc + (b.text?.length || 0), 0);
    return totalLength > 16;
  }, [buttons]);

  const iconCfg = useMemo(() => {
    switch (type) {
      case 'success':
        return { icon: CheckmarkCircle01Icon, bg: colors.success + '1A', fg: colors.success };
      case 'error':
        return { icon: AlertCircleIcon, bg: colors.danger + '1A', fg: colors.danger };
      case 'warning':
        return { icon: AlertCircleIcon, bg: colors.warning + '1A', fg: colors.warning };
      case 'info':
      default:
        return { icon: InformationCircleIcon, bg: colors.info + '1A', fg: colors.info };
    }
  }, [type, colors]);

  const handleButtonPress = useCallback((button: AlertButton) => {
    if (button.onPress) button.onPress();
    onClose();
  }, [onClose]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.body}>
            <View style={[styles.iconBox, { backgroundColor: iconCfg.bg }]}>
              <HugeiconsIcon icon={iconCfg.icon} size={24} color={iconCfg.fg} />
            </View>

            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>

          <View style={[styles.actions, isVertical && styles.actionsVertical]}>
            {buttons.map((btn, i) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              const isPrimary = !isCancel && !isDestructive;

              return (
                <BentoPressable
                  key={i}
                  style={[
                    styles.btn,
                    isVertical && styles.btnVertical,
                    isVertical && isPrimary && styles.btnPrimaryFilled,
                    isVertical && isDestructive && styles.btnDangerFilled,
                  ]}
                  onPress={() => handleButtonPress(btn)}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                    style={[
                      styles.btnText,
                      isCancel && styles.btnCancelText,
                      isDestructive && (isVertical ? styles.btnDangerFilledText : styles.btnDangerText),
                      isPrimary && (isVertical ? styles.btnPrimaryFilledText : styles.btnPrimaryText),
                    ]}
                  >
                    {btn.text}
                  </Text>
                </BentoPressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
});

const createStyles = ({ colors, overlay, typography, spacing, radius, sizes }: ThemeContextType, screenWidth: number) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: overlay.dim,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing('6'),
    },
    card: {
      width: Math.min(screenWidth - spacing('8'), 340),
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
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
      fontSize: typography.sizes.xl,
      color: colors.text,
      textAlign: 'left',
      marginBottom: spacing('2'),
    },
    message: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.md,
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
    actionsVertical: {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: spacing('2.5'),
    },
    btn: {
      height: sizes.button.md.height,
      paddingHorizontal: spacing('3.5'),
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radius('lg'),
    },
    btnVertical: {
      width: '100%',
      paddingHorizontal: spacing('4'),
    },
    btnPrimaryFilled: {
      backgroundColor: colors.primary,
    },
    btnDangerFilled: {
      backgroundColor: colors.danger,
    },
    btnText: {
      fontFamily: typography.styles.dialogAction.fontFamily,
      fontSize: typography.sizes.md,
    },
    btnPrimaryText: {
      color: colors.primary,
    },
    btnPrimaryFilledText: {
      color: colors.primaryForeground,
      fontFamily: typography.styles.buttonLabel.fontFamily,
    },
    btnCancelText: {
      color: colors.textMuted,
    },
    btnDangerText: {
      color: colors.danger,
    },
    btnDangerFilledText: {
      color: colors.primaryForeground,
      fontFamily: typography.styles.buttonLabel.fontFamily,
    },
  });
