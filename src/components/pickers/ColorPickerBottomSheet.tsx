import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { BentoBottomSheet, useBottomSheet } from '@/src/components/ui/BottomSheet';
import { Icon } from '@/src/components/ui/Icon';
import { SheetHeader } from '@/src/components/ui/SheetHeader';
import type { ColorOption } from '@/src/constants/picker';
import { PICKER_CONTRAST_COLOR } from '@/src/theme/colors';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type ColorPickerBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChange: (hex: string) => void;
  palette: readonly ColorOption[];
  title?: string;
};

const COLUMNS = 6;
const GAP = 10;

/** Perceived brightness (0–255) — picks a check mark that stays visible on the swatch. */
const brightness = (hex: string) => {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};

export const ColorPickerBottomSheet = React.memo(function ColorPickerBottomSheet({
  visible,
  onClose,
  value,
  onChange,
  palette,
  title,
}: ColorPickerBottomSheetProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { alpha, layout } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const bottomSheet = useBottomSheet();
  const { width } = useWindowDimensions();

  const cell = Math.floor((width - layout.screenPadding * 2 - GAP * (COLUMNS - 1)) / COLUMNS);
  const selected = useMemo(
    () => palette.find((c) => c.hex.toUpperCase() === value.toUpperCase()),
    [palette, value],
  );

  const handleSelect = useCallback((hex: string) => {
    Haptics.selectionAsync().catch(() => {});
    onChange(hex);
    onClose();
  }, [onChange, onClose]);

  const snapPoints = useMemo(() => ['60%'], []);

  return (
    <BentoBottomSheet visible={visible} onClose={onClose} snapPoints={snapPoints}>
      <View style={{ flex: 1 }}>
        <SheetHeader
          title={title ?? t('ui.chooseColor')}
          subtitle={selected ? t(`picker.colors.${selected.name}`) : t('ui.colorsCount', { count: palette.length })}
          trailing={<View style={[styles.preview, { backgroundColor: value }]} />}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
          onScroll={bottomSheet?.onScroll}
          scrollEventThrottle={16}
        >
          {palette.map((c) => {
            const isSelected = selected?.hex === c.hex;
            const inner = isSelected ? cell - 12 : cell - 4;
            return (
              <BentoPressable
                key={c.hex}
                onPress={() => handleSelect(c.hex)}
                scaleOnPress
                accessibilityRole="button"
                accessibilityLabel={t(`picker.colors.${c.name}`)}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.cell,
                  { width: cell, height: cell, backgroundColor: isSelected ? alpha(c.hex, 'medium') : 'transparent' },
                ]}
              >
                <View style={{ width: inner, height: inner, borderRadius: inner / 2, backgroundColor: c.hex, alignItems: 'center', justifyContent: 'center' }}>
                  {isSelected ? (
                    <Icon name="tick" size={18} weight="bold" color={brightness(c.hex) > 170 ? PICKER_CONTRAST_COLOR : theme.colors.onColor} />
                  ) : null}
                </View>
              </BentoPressable>
            );
          })}
        </ScrollView>
      </View>
    </BentoBottomSheet>
  );
});

const createStyles = ({ spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GAP,
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('1'),
      paddingBottom: spacing('6'),
    },
    cell: { borderRadius: radius('full'), alignItems: 'center', justifyContent: 'center' },
    preview: { width: 36, height: 36, borderRadius: radius('full') },
  });
