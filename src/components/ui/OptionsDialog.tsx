import { CheckIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import type { IconSvgElement } from '@hugeicons/react-native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { BentoPressable } from './BentoPressable';

export type OptionsDialogOption = {
  key: string;
  label: string;
  icon?: IconSvgElement;
  selected?: boolean;
  destructive?: boolean;
  closeOnPress?: boolean;
  onPress: () => void;
};

type OptionsDialogProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  options: OptionsDialogOption[];
  cancelLabel?: string;
};

export const OptionsDialog = React.memo(function OptionsDialog({
  visible,
  onClose,
  title,
  subtitle,
  options,
  cancelLabel = 'Cancel',
}: OptionsDialogProps) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const { width: screenWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, screenWidth), [theme, screenWidth]);

  const handleOptionPress = useCallback((option: OptionsDialogOption) => {
    Haptics.selectionAsync().catch(() => { });
    if (option.closeOnPress !== false) onClose();
    option.onPress();
  }, [onClose]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        
        <View style={styles.card}>
          {title ? (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
          ) : null}

          <View style={styles.list}>
            {options.map((opt) => {
              const selected = !!opt.selected;
              return (
                <BentoPressable
                  key={opt.key}
                  style={[styles.opt, selected && styles.optSelected]}
                  onPress={() => handleOptionPress(opt)}
                  scaleOnPress={true}
                >
                  {opt.icon ? (
                    <HugeiconsIcon
                      icon={opt.icon}
                      size={20}
                      color={selected ? colors.primary : opt.destructive ? colors.danger : colors.text}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.optLabel,
                      selected && { fontFamily: typography.fonts.semibold, color: colors.primary },
                      opt.destructive && { color: colors.danger },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {selected ? (
                    <HugeiconsIcon icon={CheckIcon} size={18} color={colors.primary} />
                  ) : null}
                </BentoPressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            <BentoPressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
            </BentoPressable>
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
      width: Math.min(screenWidth - spacing('12'), 320),
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      overflow: 'hidden',
      padding: spacing('6'),
      gap: spacing('4'),
    },
    header: {
      alignItems: 'flex-start',
      width: '100%',
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.xl,
      color: colors.text,
    },
    subtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
      marginTop: spacing('1'),
      lineHeight: 18,
    },
    list: {
      gap: spacing('2'),
      width: '100%',
    },
    opt: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      paddingHorizontal: spacing('4'),
      borderRadius: radius('lg'),
      backgroundColor: colors.background,
      gap: spacing('3'),
      width: '100%',
    },
    optSelected: {
      backgroundColor: colors.primaryLight,
    },
    optLabel: {
      flex: 1,
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      width: '100%',
      marginTop: spacing('2'),
    },
    cancelBtn: {
      height: sizes.button.md.height,
      paddingHorizontal: spacing('4'),
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radius('lg'),
    },
    cancelBtnText: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.md,
      color: colors.textMuted,
    },
  });
