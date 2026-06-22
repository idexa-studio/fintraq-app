import { PieChart01Icon, Tag01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
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

  const totalAmount = useMemo(() => {
    return categories.reduce((sum, cat) => sum + cat.amount, 0);
  }, [categories]);

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconWrapper}>
          <HugeiconsIcon icon={PieChart01Icon} size={18} color={colors.primary} />
        </View>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyTitle}>No expenses yet</Text>
          <Text style={styles.emptyText}>Add some transactions to see your top spending categories.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {items.map((cat, index) => {
        const accent = colorNumberToHex(cat.color);
        const pct = totalAmount > 0 ? Math.round((cat.amount / totalAmount) * 100) : 0;

        const marginRight = index % 2 === 0 ? theme.spacing('1.5') : 0;
        const marginLeft = index % 2 === 1 ? theme.spacing('1.5') : 0;

        return (
          <View key={cat.name} style={styles.itemContainer}>
            <View style={[styles.tile, { marginRight, marginLeft }]}>
              <View style={styles.contentRow}>
                <IconAvatar
                  icon={resolveIcon(cat.icon, Tag01Icon)}
                  color={accent}
                  variant="subtle"
                  size={32}
                  iconSize={14}
                />
                <View style={styles.textContainer}>
                  <Text style={styles.name} numberOfLines={1}>{cat.name}</Text>
                  <View style={styles.amountRow}>
                    <MoneyText amount={cat.amount} currency={currency} type="DR" weight="medium" compact style={styles.amount} />
                    {pct > 0 && (
                      <>
                        <Text style={[styles.dot, { color: colors.textMuted }]}>•</Text>
                        <Text style={[styles.percentageText, { color: colors.textMuted, fontFamily: typography.fonts.medium }]}>
                          {pct}%
                        </Text>
                      </>
                    )}
                  </View>
                </View>
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
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      marginHorizontal: layout.screenPadding,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
    },
    emptyIconWrapper: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.primary + '12',
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContent: {
      flex: 1,
      gap: 2,
    },
    emptyTitle: {
      fontFamily: typography.styles.cardTitle.fontFamily,
      fontSize: 13,
      color: colors.text,
    },
    emptyText: {
      fontFamily: typography.fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
      lineHeight: 15,
    },
    grid: {
      marginHorizontal: layout.screenPadding,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    itemContainer: { width: '50%', marginBottom: spacing('2') },
    tile: {
      backgroundColor: colors.surface,
      padding: spacing('3'),
      borderRadius: radius('xl'),
      flex: 1,
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
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
    },
    amount: { fontSize: typography.sizes.xs },
    dot: {
      fontSize: typography.sizes.xxs,
      opacity: 0.5,
    },
    percentageText: {
      fontSize: typography.sizes.xxs,
      opacity: 0.8,
    },
  });
