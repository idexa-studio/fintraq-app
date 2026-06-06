import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useCallback } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type OptionsBottomSheetOption = {
  key: string;
  label: string;
  icon?: IconName;
  selected?: boolean;
  destructive?: boolean;
  closeOnPress?: boolean;
  onPress: () => void;
};

type OptionsBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  options: OptionsBottomSheetOption[];
  closeLabel?: string;
};

export const OptionsBottomSheet = React.memo(function OptionsBottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  options,
  closeLabel = 'Cancel',
}: OptionsBottomSheetProps) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleOptionPress = useCallback((option: OptionsBottomSheetOption) => {
    if (option.closeOnPress !== false) onClose();
    option.onPress();
  }, [onClose]);

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          <View style={styles.head}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          <View style={styles.list}>
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
                    <MaterialCommunityIcons
                      name={opt.icon}
                      size={22}
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
                    <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

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
    },
    dragHandle: {
      width: 32,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.text + '24',
      alignSelf: 'center',
      marginTop: spacing('3'),
      marginBottom: spacing('2'),
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: 'hidden',
    },
    head: {
      paddingHorizontal: spacing('5'),
      paddingTop: spacing('2'),
      paddingBottom: spacing('4'),
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: 22,
      color: colors.text,
    },
    subtitle: {
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginTop: spacing('1'),
    },
    list: {
      paddingHorizontal: spacing('2'),
    },
    opt: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 54,
      paddingHorizontal: spacing('4'),
      gap: spacing('3'),
      borderRadius: radius('xl'),
    },
    optLabel: {
      flex: 1,
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    cancel: {
      height: 48,
      marginHorizontal: spacing('4'),
      marginTop: spacing('2'),
      marginBottom: Platform.OS === 'ios' ? spacing('8') : spacing('6'),
      borderRadius: radius('full'),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    cancelText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 14,
      color: colors.text,
    },
  });
