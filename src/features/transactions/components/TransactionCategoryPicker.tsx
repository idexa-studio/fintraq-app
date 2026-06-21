import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { Tag01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
      <Text style={[styles.label, { color: colors.textMuted }]}>Category</Text>
      <View style={styles.grid}>
        {categories.map((cat) => {
          const selected = selectedId === cat.id;
          const catColor = colorNumberToHex(cat.color);
          return (
            <BentoPressable
              key={cat.id}
              style={[
                styles.pill,
                { backgroundColor: selected ? catColor + '14' : colors.surface },
              ]}
              onPress={() => handleSelect(cat.id)}
            >
              <HugeiconsIcon
                icon={resolveIcon(cat.icon, Tag01Icon)}
                size={14}
                color={catColor}
              />
              <Text
                style={[
                  styles.name,
                  { color: selected ? catColor : colors.text },
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </BentoPressable>
          );
        })}
      </View>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius , layout }: ThemeContextType) => StyleSheet.create({
  container: {
    paddingVertical: spacing('3'),
    paddingHorizontal: layout.screenPadding,
  },
  label: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.xs,
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
    paddingHorizontal: spacing('3.5'),
    height: 36,
    borderRadius: radius('full'),
  },
  name: {
    fontFamily: typography.fonts.semibold,
    fontSize: 13,
  },
});
