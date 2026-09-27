import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { Icon } from '@/src/components/ui/Icon';
import { CheckIcon } from '@/src/components/ui/icons';
import { Text } from '@/src/components/ui/Text';
import { PALETTE_COLOR_OPTIONS } from '@/src/constants/picker';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  colors: readonly string[];
  value: string;
  onChange: (hex: string) => void;
};

const COLUMNS = 8;
const GAP = 8;

/**
 * Colour swatch grid for account, category and person forms. Every colour is
 * visible at once (no sideways scroll cutting swatches in half); squircle
 * swatches match the icon tiles they tint, and the choice is marked with a
 * check plus its name, never a border ring.
 */
export const ColorPickerRow = React.memo(function ColorPickerRow({ colors, value, onChange }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [width, setWidth] = useState(0);

  const size = width > 0 ? Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS) : 0;
  const selected = value.toUpperCase();
  const selectedName = PALETTE_COLOR_OPTIONS.find((c) => c.hex.toUpperCase() === selected)?.name;

  const onLayout = useCallback((e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width), []);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text variant="label" tone="muted">{t('ui.chooseColor')}</Text>
        {selectedName ? (
          <View style={styles.current}>
            <View style={[styles.currentDot, { backgroundColor: value }]} />
            <Text variant="label">{t(`picker.colors.${selectedName}`)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.grid} onLayout={onLayout}>
        {size > 0 && colors.map((hex) => {
          const isSelected = selected === hex.toUpperCase();
          const name = PALETTE_COLOR_OPTIONS.find((c) => c.hex === hex)?.name;
          return (
            <BentoPressable
              key={hex}
              onPress={() => onChange(hex)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={name ? t(`picker.colors.${name}`) : hex}
              style={[styles.swatch, { width: size, height: size, borderRadius: Math.round(size * 0.3), backgroundColor: hex }]}
            >
              {isSelected ? <Icon icon={CheckIcon} size={Math.round(size * 0.5)} color={theme.colors.onColor} weight="bold" /> : null}
            </BentoPressable>
          );
        })}
      </View>
    </View>
  );
});

const createStyles = ({ spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    wrap: { padding: spacing('4'), gap: spacing('3') },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    current: { flexDirection: 'row', alignItems: 'center', gap: spacing('1.5') },
    currentDot: { width: 10, height: 10, borderRadius: radius('full') },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
    swatch: { alignItems: 'center', justifyContent: 'center' },
  });
