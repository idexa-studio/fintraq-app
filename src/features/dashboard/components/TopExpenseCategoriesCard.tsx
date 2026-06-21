import { PieChart01Icon, Tag01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const items = categories.slice(0, 6);

  const maxAmount = useMemo(() => {
    return items.reduce((max, cat) => Math.max(max, cat.amount), 0);
  }, [items]);

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
        const ratio = maxAmount > 0 ? cat.amount / maxAmount : 0;

        const marginRight = index % 2 === 0 ? theme.spacing('1.5') : 0;
        const marginLeft = index % 2 === 1 ? theme.spacing('1.5') : 0;

        return (
          <View key={cat.name} style={styles.itemContainer}>
            <View style={[styles.tile, { marginRight, marginLeft }]}>
              <View style={styles.contentRow}>
                <View style={styles.avatarWrapper}>
                  <Svg width={40} height={40} style={styles.svg}>
                    <Circle
                      cx={20}
                      cy={20}
                      r={16.5}
                      stroke={colors.text + '08'}
                      strokeWidth={2.5}
                      fill="none"
                    />
                    <Circle
                      cx={20}
                      cy={20}
                      r={16.5}
                      stroke={accent}
                      strokeWidth={2.5}
                      strokeDasharray={103.67} // 2 * Math.PI * 16.5
                      strokeDashoffset={103.67 - (103.67 * ratio)}
                      strokeLinecap="round"
                      fill="none"
                      transform="rotate(-90 20 20)"
                    />
                  </Svg>
                  <IconAvatar
                    icon={resolveIcon(cat.icon, Tag01Icon)}
                    color={accent}
                    variant="subtle"
                    size={28}
                    iconSize={13}
                    style={styles.avatar}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.name} numberOfLines={1}>{cat.name}</Text>
                  <MoneyText amount={cat.amount} currency={currency} type="DR" weight="medium" compact style={styles.amount} />
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
      fontFamily: typography.fonts.semibold,
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
    avatarWrapper: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    svg: {
      position: 'absolute',
      top: 0,
      left: 0,
    },
    avatar: {
      position: 'absolute',
      top: 6,
      left: 6,
    },
    textContainer: {
      flex: 1,
      gap: spacing('0.5'),
    },
    name: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.medium, color: colors.text },
    amount: { fontSize: typography.sizes.xs },
  });
