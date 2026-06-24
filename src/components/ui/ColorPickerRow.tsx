import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

type Props = {
  colors: readonly string[];
  value: string;
  onChange: (hex: string) => void;
};

export const ColorPickerRow = React.memo(function ColorPickerRow({ colors, value, onChange }: Props) {
  const { colors: themeColors, spacing } = useTheme();

  const handlePress = useCallback(
    (hex: string) => (e: { stopPropagation?: () => void }) => {
      e.stopPropagation?.();
      onChange(hex);
    },
    [onChange],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, { gap: spacing('2.5'), paddingHorizontal: spacing('4'), paddingVertical: spacing('3.5') }]}
    >
      {colors.map(hex => {
        const isSelected = value.toUpperCase() === hex.toUpperCase();
        return (
          <Pressable key={hex} onPress={handlePress(hex)} hitSlop={4}>
            {isSelected ? (
              <View style={[styles.ringOuter, { borderColor: hex, backgroundColor: themeColors.surface }]}>
                <View style={[styles.ringInner, { backgroundColor: hex }]} />
              </View>
            ) : (
              <View style={[styles.dot, { backgroundColor: hex }]} />
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

const DOT = 28;
const RING = DOT + 6; // 3px gap + 3px border on each side

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
  ringOuter: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 2.5,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: DOT - 6,
    height: DOT - 6,
    borderRadius: (DOT - 6) / 2,
  },
});
