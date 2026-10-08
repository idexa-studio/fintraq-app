import { Text } from '@/src/components/ui/Text';
import { Chip } from '@/src/components/ui/Chip';
import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/shared/format/color';
import { resolveIcon } from '@/src/utils/icons';
import type { Category } from '@/src/features/categories/api/categories';

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
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleSelect = useCallback((id: number) => onSelect(id), [onSelect]);

  return (
    <View style={styles.container}>
      <Text variant="label" tone="muted" style={styles.label}>{t('transactions.category')}</Text>
      <View style={styles.grid}>
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            isActive={selectedId === cat.id}
            color={colorNumberToHex(cat.color)}
            icon={resolveIcon(cat.icon, 'tag')}
            onPress={() => handleSelect(cat.id)}
          />
        ))}
      </View>
    </View>
  );
});

const createStyles = ({ spacing, layout }: ThemeContextType) => StyleSheet.create({
  container: { paddingVertical: spacing('3'), paddingHorizontal: layout.screenPadding },
  label: { marginBottom: spacing('3') },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing('2'),
  },
});
