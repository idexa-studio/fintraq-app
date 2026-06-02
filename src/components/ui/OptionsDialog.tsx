import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useCallback } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';

type IconName = keyof typeof Ionicons.glyphMap;

export type OptionsDialogOption = {
  key: string;
  label: string;
  icon?: IconName;
  selected?: boolean;
  destructive?: boolean;
  closeOnPress?: boolean;
  onPress: () => void;
};

type OptionsDialogProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  options: OptionsDialogOption[];
  closeLabel?: string;
};

export const OptionsDialog = React.memo(function OptionsDialog({
  visible,
  onClose,
  title,
  subtitle,
  options,
  closeLabel = 'Cancel',
}: OptionsDialogProps) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleOptionPress = useCallback((option: OptionsDialogOption) => {
    if (option.closeOnPress !== false) onClose();
    option.onPress();
  }, [onClose]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.head}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          {options.map((opt) => {
            const selected = !!opt.selected;
            return (
              <TouchableOpacity
                key={opt.key}
                style={styles.opt}
                activeOpacity={0.6}
                onPress={() => handleOptionPress(opt)}
              >
                {opt.icon ? (
                  <Ionicons
                    name={opt.icon}
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
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.cancel} onPress={onClose} activeOpacity={0.6}>
            <Text style={styles.cancelText}>{closeLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const createStyles = ({ colors, overlay, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: overlay.dim,
      justifyContent: 'flex-end',
      padding: spacing('4'),
      paddingBottom: spacing('9'),
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      borderWidth: 0.5,
      borderColor: colors.text + '0C',
      overflow: 'hidden',
    },
    head: {
      padding: spacing('5'),
      paddingBottom: spacing('3'),
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: 20,
      color: colors.text,
    },
    subtitle: {
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginTop: spacing('1'),
    },
    opt: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 52,
      paddingHorizontal: spacing('5'),
      gap: spacing('3'),
      borderTopWidth: 1,
      borderTopColor: colors.text + '08',
    },
    optLast: {},
    optLabel: {
      flex: 1,
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    cancel: {
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    cancelText: {
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.md,
      color: colors.textMuted,
    },
  });
