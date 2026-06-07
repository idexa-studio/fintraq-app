import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useCallback } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';
import { BentoPressable } from './BentoPressable';
import { BentoBottomSheet } from './BottomSheet';

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
    <BentoBottomSheet
      visible={visible}
      onClose={onClose}
    >
      <View style={styles.content}>
        <View style={styles.head}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <View style={styles.list}>
          {options.map((opt) => {
            const selected = !!opt.selected;
            return (
              <BentoPressable
                key={opt.key}
                style={styles.opt}
                onPress={() => handleOptionPress(opt)}
                scaleOnPress={false}
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
              </BentoPressable>
            );
          })}
        </View>

        <BentoPressable style={styles.cancel} onPress={onClose}>
          <Text style={styles.cancelText}>{closeLabel}</Text>
        </BentoPressable>
      </View>
    </BentoBottomSheet>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    content: {
      paddingBottom: Platform.OS === 'ios' ? spacing('4') : spacing('2'),
    },
    head: {
      paddingHorizontal: layout.screenPadding,
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
      marginHorizontal: layout.screenPadding,
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
