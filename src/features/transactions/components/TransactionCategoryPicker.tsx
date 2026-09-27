import { Text } from '@/src/components/ui/Text';
import { Chip } from '@/src/components/ui/Chip';
import { Tag01Icon } from '@hugeicons/core-free-icons';
import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
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
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleSelect = useCallback((id: number) => onSelect(id), [onSelect]);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{t('transactions.category')}</Text>
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
    ...typography.metrics.xs,
    marginBottom: spacing('3'),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing('2'),
  },
});
