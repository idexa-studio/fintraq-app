import { GridIcon } from '@hugeicons/core-free-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { BentoBottomSheet, useBottomSheet } from '@/src/components/ui/BottomSheet';
import { Icon } from '@/src/components/ui/Icon';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { SheetHeader } from '@/src/components/ui/SheetHeader';
import { Text } from '@/src/components/ui/Text';
import type { IconGroup } from '@/src/constants/picker';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { resolveIcon } from '@/src/utils/icons';

type IconPickerBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChange: (icon: string) => void;
  groups: IconGroup[];
  /** The colour the icon will be shown in (category / account colour). */
  accentColor?: string;
  title?: string;
};

const COLUMNS = 7;
const GAP = 8;

export const IconPickerBottomSheet = React.memo(function IconPickerBottomSheet({
  visible,
  onClose,
  value,
  onChange,
  groups,
  accentColor,
  title,
}: IconPickerBottomSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors, layout } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const accent = accentColor ?? colors.primary;
  const bottomSheet = useBottomSheet();
  const { width } = useWindowDimensions();

  // Size cells from the real width so the grid has equal gutters on every phone.
  const cell = Math.floor((width - layout.screenPadding * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  const selectedGroup = useMemo(() => groups.find((g) => g.icons.includes(value)), [groups, value]);

  const handleSelect = useCallback((icon: string) => {
    Haptics.selectionAsync().catch(() => {});
    onChange(icon);
    onClose();
  }, [onChange, onClose]);

  const snapPoints = useMemo(() => ['80%'], []);

  return (
    <BentoBottomSheet visible={visible} onClose={onClose} snapPoints={snapPoints}>
      <View style={{ flex: 1 }}>
        <SheetHeader
          title={title ?? t('ui.chooseIcon')}
          subtitle={selectedGroup ? t(`picker.groups.${selectedGroup.label}` as 'picker.groups.other') : undefined}
          trailing={value ? <IconAvatar icon={resolveIcon(value, GridIcon)} color={accent} variant="solid" size={44} /> : null}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={bottomSheet?.onScroll}
          scrollEventThrottle={16}
        >
          {groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text variant="label" tone="muted" style={styles.groupLabel}>
                {t(`picker.groups.${group.label}` as 'picker.groups.other')}
              </Text>
              <View style={styles.grid}>
                {group.icons.map((icon) => {
                  const selected = value === icon;
                  return (
                    <BentoPressable
                      key={icon}
                      onPress={() => handleSelect(icon)}
                      accessibilityRole="button"
                      accessibilityLabel={icon.replace(/-/g, ' ')}
                      accessibilityState={{ selected }}
                      style={[
                        styles.cell,
                        { width: cell, height: cell, backgroundColor: selected ? accent : colors.background },
                      ]}
                    >
                      <Icon icon={resolveIcon(icon, GridIcon)} size={20} color={selected ? colors.onColor : colors.text} />
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

const createStyles = ({ spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    scrollContent: { paddingBottom: spacing('6'), gap: spacing('5') },
    group: { paddingHorizontal: layout.screenPadding, gap: spacing('2.5') },
    groupLabel: { paddingLeft: spacing('0.5') },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
    cell: { borderRadius: radius('md'), alignItems: 'center', justifyContent: 'center' },
  });
