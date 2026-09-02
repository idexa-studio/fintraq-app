import { GridIcon, LockPasswordIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';
import { colorNumberToHex } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { Category } from '../api/categories';

interface CategoryCardProps {
  item: Category;
  index: number;
  isFirst?: boolean;
  isLast?: boolean;
  onPress: (item: Category) => void;
  onLongPress: (item: Category) => void;
}

const TYPE_META: Record<string, { label: string; colorKey: 'success' | 'danger' | 'primary' | 'textMuted' }> = {
  CR: { label: 'Income',   colorKey: 'success' },
  DR: { label: 'Expense',  colorKey: 'danger'  },
  TR: { label: 'Transfer', colorKey: 'primary' },
};

export const CategoryCard = React.memo(function CategoryCard({
  item,
  isFirst,
  isLast,
  onPress,
  onLongPress,
}: CategoryCardProps) {
  const theme = useTheme();
  const { colors, radius, spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const catColor = useMemo(
    () => (item.color ? colorNumberToHex(item.color) : colors.primary),
    [item.color, colors.primary],
  );

  const typeParts = useMemo(
    () => item.type.split(',').filter(Boolean) as Array<'CR' | 'DR' | 'TR'>,
    [item.type],
  );

  const containerStyle = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderTopLeftRadius: isFirst ? radius('xl') : 0,
      borderTopRightRadius: isFirst ? radius('xl') : 0,
      borderBottomLeftRadius: isLast ? radius('xl') : 0,
      borderBottomRightRadius: isLast ? radius('xl') : 0,
      marginBottom: isLast ? 0 : spacing('0.5'),
    }),
    [isFirst, isLast, colors.surface, radius, spacing],
  );

  const handlePress = useCallback(() => onPress(item), [onPress, item]);
  const handleLongPress = useCallback(() => onLongPress(item), [onLongPress, item]);

  return (
    <BentoPressable
      style={[styles.row, containerStyle]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={280}
      scaleOnPress={false}
    >
      <IconAvatar
        icon={resolveIcon(item.icon, GridIcon)}
        color={catColor}
        variant="subtle"
        size={40}
        iconSize={16}
      />

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          {item.isSystem && (
            <HugeiconsIcon icon={LockPasswordIcon} size={11} color={colors.textMuted} />
          )}
        </View>
        <View style={styles.badges}>
          {typeParts.map(t => {
            const meta = TYPE_META[t] ?? { label: t, colorKey: 'textMuted' as const };
            const badgeColor = colors[meta.colorKey];
            return (
              <View key={t} style={[styles.badge, { backgroundColor: badgeColor + '18' }]}>
                <Text style={[styles.badgeText, { color: badgeColor }]}>{meta.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </BentoPressable>
  );
});

const createStyles = ({ colors, typography, spacing }: ThemeContextType) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing('3'),
      paddingHorizontal: spacing('3.5'),
      gap: spacing('2.5'),
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: spacing('1'),
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
    },
    name: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: typography.sizes.sm,
      color: colors.text,
      lineHeight: 18,
      flex: 1,
    },
    badges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('1'),
    },
    badge: {
      borderRadius: 99,
      paddingHorizontal: spacing('1.5'),
      paddingVertical: 2,
    },
    badgeText: {
      fontFamily: typography.styles.chipLabel.fontFamily,
      fontSize: 10,
    },
  });
