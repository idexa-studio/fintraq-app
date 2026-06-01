import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconAvatar } from '../../../components/ui/IconAvatar';
import { MoneyText } from '../../../components/ui/MoneyText';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { colorNumberToHex } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';

type TopExpenseCategory = {
  name: string;
  icon: string;
  color: number;
  amount: number;
};

type TopExpenseCategoriesCardProps = {
  currency: string;
  categories: TopExpenseCategory[];
};

export const TopExpenseCategoriesCard = React.memo(function TopExpenseCategoriesCard({
  currency,
  categories,
}: TopExpenseCategoriesCardProps) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const maxAmount = useMemo(
    () => categories.reduce((max, item) => (item.amount > max ? item.amount : max), 0),
    [categories],
  );

  if (categories.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.empty}>
          <Ionicons name="pie-chart-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.emptyText, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
            No expense data yet
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {categories.map((category, idx) => {
        const accent = colorNumberToHex(category.color);
        const ratio = maxAmount > 0 ? category.amount / maxAmount : 0;

        return (
          <View key={`${category.name}-${idx}`} style={styles.row}>
            <View style={styles.left}>
              <Text style={[styles.rank, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
                {idx + 1}
              </Text>
              <IconAvatar icon={resolveIcon(category.icon, 'pricetag-outline')} bg={accent} color={colors.text} size={28} iconSize={13} />
              <View style={styles.meta}>
                <Text style={[styles.name, { fontFamily: typography.fonts.semibold, color: colors.text }]} numberOfLines={1}>
                  {category.name}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.max(6, ratio * 100)}%`, backgroundColor: accent }]} />
                </View>
              </View>
            </View>
            <View style={styles.right}>
              <MoneyText amount={category.amount} currency={currency} type="DR" weight="bold" compact style={styles.amount} />
              <Text style={[styles.percent, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                {`${(ratio * 100).toFixed(0)}%`}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      marginHorizontal: layout.screenPadding,
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing('3'),
      paddingHorizontal: spacing('3.5'),
      paddingVertical: spacing('3'),
    },
    left: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
    },
    rank: {
      fontSize: 10,
      opacity: 0.5,
      width: 16,
    },
    meta: { flex: 1 },
    name: {
      fontSize: typography.sizes.xs,
      marginBottom: spacing('1'),
    },
    barTrack: {
      height: 3,
      borderRadius: radius('full'),
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    barFill: {
      height: 3,
      borderRadius: radius('full'),
    },
    right: {
      alignItems: 'flex-end',
      gap: spacing('0.5'),
    },
    amount: {
      fontSize: typography.sizes.sm,
    },
    percent: {
      fontSize: 10,
      opacity: 0.5,
    },
    empty: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      paddingHorizontal: spacing('3.5'),
      paddingVertical: spacing('3.5'),
    },
    emptyText: {
      fontSize: typography.sizes.xs,
    },
  });
