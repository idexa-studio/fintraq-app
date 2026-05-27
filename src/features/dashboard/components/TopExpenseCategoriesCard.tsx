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
  currencies: string[];
  currency: string;
  categories: TopExpenseCategory[];
};

export const TopExpenseCategoriesCard = React.memo(function TopExpenseCategoriesCard({
  currencies,
  currency,
  categories,
}: TopExpenseCategoriesCardProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const maxAmount = useMemo(
    () => categories.reduce((max, item) => (item.amount > max ? item.amount : max), 0),
    [categories]
  );


  return (
    <View style={styles.card}>
      {categories.length > 0 ? (
        categories.map((category, idx) => {
          const isLast = idx === categories.length - 1;
          const accent = colorNumberToHex(category.color);
          const ratio = maxAmount > 0 ? category.amount / maxAmount : 0;
          return (
            <View key={`${category.name}-${idx}`} style={[styles.row, isLast && styles.rowLast]}>
              <View style={styles.left}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{idx + 1}</Text>
                </View>
                <IconAvatar icon={resolveIcon(category.icon, 'pricetag-outline')} bg={accent + '22'} color={accent} size={28} iconSize={14} />
                <View style={styles.meta}>
                  <Text style={styles.name} numberOfLines={1}>{category.name}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.max(8, ratio * 100)}%`, backgroundColor: accent }]} />
                  </View>
                </View>
              </View>
              <View style={styles.right}>
                <MoneyText amount={category.amount} currency={currency} type="DR" weight="bold" compact style={styles.amount} />
                <Text style={styles.percent}>{`${(ratio * 100).toFixed(0)}%`}</Text>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.empty}>
          <Ionicons name="pie-chart-outline" size={18} color={colors.textMuted} />
          <Text style={styles.emptyText}>No expense data yet for {currency}</Text>
        </View>
      )}
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius , layout }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      marginHorizontal: layout.screenPadding,
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      overflow: 'hidden',
      marginBottom: spacing('5'),
    },
    tabsRow: {
      flexDirection: 'row',
      gap: spacing('1.5'),
      paddingHorizontal: spacing('3'),
      paddingTop: spacing('2.5'),
      paddingBottom: spacing('1.5'),
    },
    tab: {
      height: 26,
      borderRadius: radius('full'),
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background + 'AA',
      paddingHorizontal: spacing('2.5'),
      justifyContent: 'center',
    },
    tabActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    tabText: {
      fontFamily: typography.fonts.semibold,
      color: colors.textMuted,
      fontSize: 11,
      letterSpacing: 0.4,
    },
    tabTextActive: {
      color: colors.background,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing('3'),
      paddingHorizontal: spacing('3.5'),
      paddingVertical: spacing('2.5'),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    left: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
    },
    rankBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background + 'AA',
      borderWidth: 1,
      borderColor: colors.border,
    },
    rankText: {
      fontFamily: typography.fonts.semibold,
      color: colors.textMuted,
      fontSize: 10,
    },
    meta: {
      flex: 1,
    },
    name: {
      fontFamily: typography.fonts.semibold,
      color: colors.text,
      fontSize: 12,
      marginBottom: spacing('1'),
    },
    barTrack: {
      height: 4,
      borderRadius: radius('full'),
      backgroundColor: colors.background + 'CC',
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: radius('full'),
      minWidth: 8,
    },
    right: {
      minWidth: 88,
      alignItems: 'flex-end',
    },
    amount: {
      fontSize: 13,
      lineHeight: 15,
    },
    percent: {
      marginTop: spacing('0.5'),
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      fontSize: 10,
    },
    empty: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      paddingHorizontal: spacing('3.5'),
      paddingVertical: spacing('3.5'),
    },
    emptyText: {
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      fontSize: 12,
    },
  });
