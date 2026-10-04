import { Icon } from './Icon';
import type { IconSource } from './Icon';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { BentoPressable } from './BentoPressable';
import { BentoBottomSheet, useBottomSheet } from './BottomSheet';

export type OptionsBottomSheetOption = {
  key: string;
  label: string;
  icon?: IconSource;
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
  /** Fixed height for long lists (e.g. ['75%']); list scrolls inside. */
  snapPoints?: string[];
};

export const OptionsBottomSheet = React.memo(function OptionsBottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  options,
  closeLabel,
  snapPoints,
}: OptionsBottomSheetProps) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const bottomSheet = useBottomSheet();

  const handleOptionPress = useCallback((option: OptionsBottomSheetOption) => {
    Haptics.selectionAsync().catch(() => { });
    if (option.closeOnPress !== false) onClose();
    option.onPress();
  }, [onClose]);

  return (
    <BentoBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={snapPoints}
    >
      <View style={styles.container}>
        {title ? (
          <View style={styles.head}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        ) : null}

        <ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={bottomSheet?.onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.list}
        >
          {options.map((opt) => {
            const selected = !!opt.selected;
            return (
              <BentoPressable
                key={opt.key}
                style={[styles.opt, selected && styles.optSelected]}
                onPress={() => handleOptionPress(opt)}
                scaleOnPress={false}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={opt.label}
              >
                {opt.icon ? (
                  <Icon
                    name={opt.icon}
                    size={22}
                    color={selected ? colors.primaryInk : opt.destructive ? colors.danger : colors.text}
                  />
                ) : null}
                <Text
                  style={[
                    styles.optLabel,
                    selected && { fontFamily: typography.styles.chipLabelActive.fontFamily, color: colors.primaryInk },
                    opt.destructive && { color: colors.danger },
                  ]}
                >
                  {opt.label}
                </Text>
                {selected ? (
                  <Icon name="tick" size={18} color={colors.primaryInk} weight="bold" />
                ) : null}
              </BentoPressable>
            );
          })}
        </ScrollView>
      </View>
    </BentoBottomSheet>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout, isDark }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      flexShrink: 1,
      flexGrow: 1,
      paddingBottom: spacing("2"),
    },
    head: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: spacing('4'),
    },
    title: {
      fontFamily: typography.fonts.heading,
      ...typography.metrics.xl,
      color: colors.text,
    },
    subtitle: {
      fontFamily: typography.fonts.medium,
      ...typography.metrics.xs,
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
      backgroundColor: colors.primaryLight,
    },
    optLabel: {
      flex: 1,
      fontFamily: typography.fonts.medium,
      ...typography.metrics.md,
      color: colors.text,
    },
  });
