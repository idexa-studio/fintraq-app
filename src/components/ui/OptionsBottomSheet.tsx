import { CheckIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import type { IconSvgElement } from '@hugeicons/react-native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../providers/ThemeProvider';
import { BentoPressable } from './BentoPressable';
import { BentoBottomSheet } from './BottomSheet';

export type OptionsBottomSheetOption = {
  key: string;
  label: string;
  icon?: IconSvgElement;
  selected?: boolean;
  destructive?: boolean;
  closeOnPress?: boolean;
  onPress: () => void;
};

type OptionsBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
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
    Haptics.selectionAsync().catch(() => { });
    if (option.closeOnPress !== false) onClose();
    option.onPress();
  }, [onClose]);

  return (
    <BentoBottomSheet
      visible={visible}
      onClose={onClose}
    >
      <View style={styles.content}>
        {title ? (
          <View style={styles.head}>
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
                scaleOnPress={false}
              >
                {opt.icon ? (
                  <HugeiconsIcon
                    icon={opt.icon}
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
                  <HugeiconsIcon icon={CheckIcon} size={18} color={colors.primary} />
                ) : null}
              </BentoPressable>
            );
          })}
        </View>
      </View>
    </BentoBottomSheet>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout, isDark }: ThemeContextType) =>
  StyleSheet.create({
    content: {
      paddingBottom: spacing("3"),

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
      paddingVertical: spacing('1'),
    },
    opt: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 50,
      paddingHorizontal: layout.screenPadding,
      marginVertical: spacing('0.5'),
      gap: spacing('3'),
    },
    optSelected: {
      backgroundColor: isDark ? '#163228' : '#E6F4EA',
    },
    optLabel: {
      flex: 1,
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.md,
      color: colors.text,
    },
  });
