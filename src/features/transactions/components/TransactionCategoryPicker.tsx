import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';
import { colorNumberToHex } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import type { Category } from '../../categories/api/categories';

type Props = {
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

export const TransactionCategoryPicker = React.memo(function TransactionCategoryPicker({
  categories,
  selectedId,
  onSelect,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleSelect = useCallback((id: number) => onSelect(id), [onSelect]);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>CATEGORY</Text>
      <View style={styles.grid}>
        {categories.map((cat) => {
          const selected = selectedId === cat.id;
          const catColor = colorNumberToHex(cat.color);
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.pill,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selected && { backgroundColor: catColor, borderColor: catColor },
              ]}
              onPress={() => handleSelect(cat.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={resolveIcon(cat.icon, 'pricetag-outline')}
                size={14}
                color={selected ? colors.background : catColor}
              />
              <Text
                style={[
                  styles.name,
                  { color: selected ? colors.background : colors.text },
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const createStyles = ({ typography, spacing, radius , layout }: ThemeContextType) => StyleSheet.create({
  container: {
    paddingVertical: spacing('3'),
    paddingHorizontal: layout.screenPadding,
  },
  label: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: spacing('3'),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing('2'),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('2'),
    paddingHorizontal: spacing('3'),
    height: 36,
    borderRadius: radius('full'),
    borderWidth: 1,
  },
  name: {
    fontFamily: typography.fonts.medium,
    fontSize: 13,
  },
});
