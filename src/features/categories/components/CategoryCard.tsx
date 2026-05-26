import { Ionicons } from '@expo/vector-icons';
import { resolveIcon } from '../../../utils/icons';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';
import { IconAvatar } from '../../../components/ui/IconAvatar';
import { colorNumberToHex } from '../../../utils/format';
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
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const catColor = useMemo(
    () => (item.color ? colorNumberToHex(item.color) : colors.primary),
    [item.color, colors.primary],
  );

  const handlePress = useCallback(() => onPress(item), [onPress, item]);
  const handleLongPress = useCallback(() => onLongPress(item), [onLongPress, item]);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={280}
      activeOpacity={0.75}
    >
      <View style={[styles.accent, { backgroundColor: catColor }]} />

      <IconAvatar icon={resolveIcon(item.icon, 'grid-outline')} bg={catColor + '1A'} color={catColor} size={40} iconSize={18} />

      <Text style={styles.name} numberOfLines={1}>
        {item.name}
      </Text>

      <Ionicons name="chevron-forward" size={14} color={colors.textMuted + '80'} />
    </TouchableOpacity>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius('lg'),
      paddingRight: spacing('4'),
      paddingVertical: spacing('3'),
      overflow: 'hidden',
      gap: spacing('3'),
      marginBottom: spacing('2'),
    },
    accent: {
      width: 4,
      height: '100%',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: 2,
    },
    name: {
      flex: 1,
      fontFamily: typography.fonts.semibold,
      fontSize: 15,
      color: colors.text,
      letterSpacing: -0.2,
    },
  });
