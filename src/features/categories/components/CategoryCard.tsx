import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    <TouchableOpacity
      style={styles.tile}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={280}
      activeOpacity={0.72}
    >
      <View style={[styles.iconWrap, { backgroundColor: catColor + '22' }]}>
        <Ionicons
          name={resolveIcon(item.icon, 'grid-outline')}
          size={14}
          color={colors.text}
        />
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
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
      fontFamily: typography.fonts.semibold,
      fontSize: 13,
      color: colors.text,
      letterSpacing: -0.1,
      lineHeight: 18,
    },
  });
