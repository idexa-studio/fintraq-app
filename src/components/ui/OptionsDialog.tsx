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
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <View style={styles.optionsWrap}>
            {options.map((opt) => {
              const selected = !!opt.selected;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.tile, selected && styles.tileSelected]}
                  activeOpacity={0.7}
                  onPress={() => handleOptionPress(opt)}
                >
                  <View style={[styles.tileIcon, selected && styles.tileIconSelected]}>
                    {opt.icon ? (
                      <Ionicons
                        name={opt.icon}
                        size={18}
                        color={selected ? colors.primary : opt.destructive ? colors.danger : colors.text}
                      />
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.tileLabel,
                      selected && styles.tileLabelSelected,
                      opt.destructive && !selected && { color: colors.danger },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <View style={[styles.tileRadio, selected && styles.tileRadioSelected]}>
                    {selected && <View style={styles.tileRadioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

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
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: 20,
      color: colors.text,
      marginBottom: spacing('1'),
    },
    subtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginBottom: spacing('5'),
    },
    optionsWrap: {
      gap: spacing('2.5'),
      marginBottom: spacing('4'),
    },
    tile: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius('lg'),
      padding: spacing('3.5'),
      gap: spacing('3'),
    },
    tileSelected: {
      backgroundColor: colors.primary + '0C',
      borderWidth: 1.5,
      borderColor: colors.primary + '40',
      padding: spacing('3.5') - 1.5,
    },
    tileIcon: {
      width: 36,
      height: 36,
      borderRadius: radius('full'),
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tileIconSelected: {
      backgroundColor: colors.primary + '15',
    },
    tileLabel: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    tileLabelSelected: {
      fontFamily: typography.fonts.semibold,
      color: colors.primary,
    },
    tileRadio: {
      width: 20,
      height: 20,
      borderRadius: radius('full'),
      borderWidth: 2,
      borderColor: colors.text + '18',
    },
    tileRadioSelected: {
      borderColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tileRadioDot: {
      width: 10,
      height: 10,
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
    },
    btnClose: {
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
