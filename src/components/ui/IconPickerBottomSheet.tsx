import { GridIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { IconGroup } from '../../constants/picker';
import { ThemeContextType, useTheme } from '../../providers/ThemeProvider';
import { resolveIcon } from '../../utils/icons';
import { BentoPressable } from './BentoPressable';
import { BentoBottomSheet, useBottomSheet } from './BottomSheet';

type IconPickerBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChange: (icon: string) => void;
  groups: IconGroup[];
  accentColor?: string;
  title?: string;
};

const CELL_SIZE = 48;

export const IconPickerBottomSheet = React.memo(function IconPickerBottomSheet({
  visible,
  onClose,
  value,
  onChange,
  groups,
  accentColor,
  title = 'Choose icon',
}: IconPickerBottomSheetProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const accent = accentColor ?? colors.primary;
  const bottomSheet = useBottomSheet();

  const handleSelect = useCallback(
    (icon: string) => {
      Haptics.selectionAsync().catch(() => {});
      onChange(icon);
      onClose();
    },
    [onChange, onClose],
  );

  const snapPoints = useMemo(() => ['80%'], []);

  return (
    <BentoBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={snapPoints}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {value ? (
            <View style={styles.headerIconContainer}>
              <HugeiconsIcon
                icon={resolveIcon(value, GridIcon)}
                size={20}
                color={colors.primary}
              />
            </View>
          ) : null}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          onScroll={bottomSheet?.onScroll}
          scrollEventThrottle={16}
        >
          {groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text style={styles.groupLabel}>
                {group.label.charAt(0).toUpperCase() + group.label.slice(1).toLowerCase()}
              </Text>
              <View style={styles.iconGrid}>
                {group.icons.map((icon) => {
                  const selected = value === icon;
                  return (
                    <BentoPressable
                      key={icon}
                      style={[
                        styles.iconCell,
                        { backgroundColor: selected ? (theme.isDark ? '#163228' : '#E6F4EA') : colors.background }
                      ]}
                      onPress={() => handleSelect(icon)}
                      scaleOnPress={true}
                    >
                      <HugeiconsIcon
                        icon={resolveIcon(icon, GridIcon)}
                        size={20}
                        color={selected ? accent : colors.text}
                      />
                    </BentoPressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </BentoBottomSheet>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: spacing('2'),
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: 22,
      color: colors.text,
    },
    headerIconContainer: {
      width: 32,
      height: 32,
      borderRadius: radius('md'),
      backgroundColor: colors.primary + '12',
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      paddingBottom: spacing('3'),
      gap: spacing('4'),
    },
    group: {
      paddingHorizontal: layout.screenPadding,
      gap: spacing('2'),
    },
    groupLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 12,
      color: colors.textMuted,
      paddingLeft: spacing('1'),
      opacity: 0.7,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('2.5'),
    },
    iconCell: {
      width: CELL_SIZE,
      height: CELL_SIZE,
      borderRadius: radius('md'),
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
