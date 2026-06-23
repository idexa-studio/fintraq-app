import { Chip } from '@/src/components/ui/Chip';
import { Tag01Icon } from '@hugeicons/core-free-icons';
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
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            isActive={selectedId === cat.id}
            color={colorNumberToHex(cat.color)}
            icon={resolveIcon(cat.icon, Tag01Icon)}
            onPress={() => handleSelect(cat.id)}
          />
        ))}
      </View>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, layout }: ThemeContextType) => StyleSheet.create({
  container: {
    paddingVertical: spacing('3'),
    paddingHorizontal: layout.screenPadding,
  },
  label: {
    fontFamily: typography.styles.sectionLabel.fontFamily,
    fontSize: typography.sizes.xs,
    marginBottom: spacing('3'),
    opacity: 0.6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing('2'),
  },
});
