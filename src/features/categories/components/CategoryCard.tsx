import { ListItem } from '@/src/components/ui/ListItem';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { Icon } from '@/src/components/ui/Icon';
import { Category } from '@/src/features/categories/api/categories';
import { useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

interface CategoryCardProps {
  item: Category;
  onPress: (item: Category) => void;
  onLongPress: (item: Category) => void;
}

const TYPE_LABEL = { CR: 'income', DR: 'expense', TR: 'transfer' } as const;

/**
 * One category row. Tap edits; long-press opens more options. The type list is
 * only shown when a category spans several types — the tab already says the rest.
 */
export const CategoryCard = React.memo(function CategoryCard({ item, onPress, onLongPress }: CategoryCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const hex = useMemo(() => (item.color ? colorNumberToHex(item.color) : colors.primary), [item.color, colors.primary]);
  const types = useMemo(() => item.type.split(',').filter(Boolean) as (keyof typeof TYPE_LABEL)[], [item.type]);
  const subtitle = types.length > 1 ? types.map((ty) => t(`categoryForm.${TYPE_LABEL[ty]}`)).join(' · ') : undefined;

  const handlePress = useCallback(() => onPress(item), [onPress, item]);
  const handleLongPress = useCallback(() => onLongPress(item), [onLongPress, item]);

  return (
    <ListItem
      leading={<IconAvatar icon={resolveIcon(item.icon, 'tag')} color={hex} size={40} />}
      title={item.name}
      subtitle={subtitle}
      onPress={handlePress}
      onLongPress={handleLongPress}
      trailing={item.isSystem ? (
        <View accessibilityLabel={t('categories.systemCategory')}>
          <Icon name="lock-key" size={16} color={colors.textMuted} />
        </View>
      ) : undefined}
    />
  );
});
