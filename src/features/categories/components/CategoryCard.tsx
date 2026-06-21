import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { GridIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';
import { colorNumberToHex } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { Category } from '../api/categories';

interface CategoryCardProps {
  item: Category;
  index: number;
  onPress: (item: Category) => void;
  onLongPress: (item: Category) => void;
}

export const CategoryCard = React.memo(function CategoryCard({
  item,
  onPress,
  onLongPress,
}: CategoryCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const catColor = useMemo(
    () => (item.color ? colorNumberToHex(item.color) : theme.colors.primary),
    [item.color, theme.colors.primary],
  );

  const handlePress = useCallback(() => onPress(item), [onPress, item]);
  const handleLongPress = useCallback(() => onLongPress(item), [onLongPress, item]);

  return (
    <BentoPressable
      style={styles.tile}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={280}
    >
      <View style={[styles.iconWrap, { backgroundColor: catColor + '22' }]}>
        <HugeiconsIcon
          icon={resolveIcon(item.icon, GridIcon)}
          size={14}
          color={catColor}
        />
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>
    </BentoPressable>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    tile: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      paddingVertical: spacing('3.5'),
      paddingHorizontal: spacing('3'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2.5'),
    },
    iconWrap: {
      width: 30,
      height: 30,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    name: {
      flex: 1,
      fontFamily: typography.fonts.medium,
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
    },
  });
