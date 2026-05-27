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
  closeLabel = 'Close',
}: OptionsDialogProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleOptionPress = useCallback((option: OptionsDialogOption) => {
    if (option.closeOnPress !== false) onClose();
    option.onPress();
  }, [onClose]);

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
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          {options.map((opt, i) => {
            const selected = !!opt.selected;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.row,
                  i === 0 && styles.rowFirst,
                  i === options.length - 1 && styles.rowLast,
                  selected && styles.rowSelected,
                  opt.destructive && !selected && styles.rowDanger,
                ]}
                activeOpacity={0.7}
                onPress={() => handleOptionPress(opt)}
              >
                {opt.icon ? (
                  <Ionicons
                    name={opt.icon}
                    size={18}
                    color={selected ? colors.primary : opt.destructive ? colors.danger : colors.text}
                  />
                ) : null}
                <Text
                  style={[
                    styles.rowLabel,
                    selected && styles.rowLabelSelected,
                    opt.destructive && !selected && styles.rowLabelDanger,
                  ]}
                >
                  {opt.label}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                ) : (
                  <View style={styles.rowSpacer} />
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.btnClose} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.btnCloseText}>{closeLabel}</Text>
          </TouchableOpacity>
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
      gap: spacing('0.5'),
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: 18,
      color: colors.text,
      marginBottom: spacing('1'),
    },
    subtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginBottom: spacing('3'),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      paddingHorizontal: spacing('3'),
      borderRadius: radius('md'),
      gap: spacing('3'),
    },
    rowFirst: {
      borderTopLeftRadius: radius('md'),
      borderTopRightRadius: radius('md'),
    },
    rowLast: {
      borderBottomLeftRadius: radius('md'),
      borderBottomRightRadius: radius('md'),
    },
    rowSelected: {
      backgroundColor: colors.primary + '10',
    },
    rowDanger: {
      backgroundColor: colors.danger + '06',
    },
    rowLabel: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    rowLabelSelected: {
      fontFamily: typography.fonts.semibold,
      color: colors.primary,
    },
    rowLabelDanger: {
      color: colors.danger,
    },
    rowSpacer: {
      width: 16,
    },
    btnClose: {
      marginTop: spacing('4'),
      height: 44,
      borderRadius: radius('md'),
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    btnCloseText: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
  });
