import { MaterialCommunityIcons } from '@expo/vector-icons';
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

type Props = {
  currency: string;
  categories: TopExpenseCategory[];
};

export const TopExpenseCategoriesCard = React.memo(function TopExpenseCategoriesCard({
  currency,
  categories,
}: Props) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const items = categories.slice(0, 6);

  const maxAmount = useMemo(() => {
    return items.reduce((max, cat) => Math.max(max, cat.amount), 0);
  }, [items]);

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <MaterialCommunityIcons name="chart-pie" size={typography.sizes.md} color={colors.textMuted} />
        <Text style={[styles.emptyText, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>No expense data yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {items.map((cat, index) => {
        const accent = colorNumberToHex(cat.color);
        const ratio = maxAmount > 0 ? cat.amount / maxAmount : 0;

        const marginRight = index % 2 === 0 ? theme.spacing('1.5') : 0;
        const marginLeft = index % 2 === 1 ? theme.spacing('1.5') : 0;

        return (
          <View key={cat.name} style={styles.itemContainer}>
            <View style={[styles.tile, { marginRight, marginLeft }]}>
              <View style={styles.contentRow}>
                <IconAvatar icon={resolveIcon(cat.icon, 'tag-outline')} color={accent} variant="subtle" size={32} iconSize={15} />
                <View style={styles.textContainer}>
                  <Text style={styles.name} numberOfLines={1}>{cat.name}</Text>
                  <MoneyText amount={cat.amount} currency={currency} type="DR" weight="medium" compact style={styles.amount} />
                </View>
              </View>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${Math.max(4, ratio * 100)}%`, backgroundColor: accent }]} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    empty: {
      marginHorizontal: layout.screenPadding,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      padding: spacing('3.5'),
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
    },
    emptyText: { fontSize: typography.sizes.xs },
    grid: {
      marginHorizontal: layout.screenPadding,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    itemContainer: { width: '50%', marginBottom: spacing('2') },
    tile: {
      backgroundColor: colors.surface,
      padding: spacing('3'),
      borderRadius: radius('lg'),
      flex: 1,
      gap: spacing('1'),
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
    },
    textContainer: {
      flex: 1,
      gap: spacing('0.5'),
    },
    name: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium, color: colors.text },
    amount: { fontSize: typography.sizes.xs },
    progressContainer: {
      height: 4,
      backgroundColor: colors.background + '40',
      borderRadius: radius('full'),
      marginTop: spacing('2.5'),
      width: '100%',
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: radius('full'),
    },
  });
