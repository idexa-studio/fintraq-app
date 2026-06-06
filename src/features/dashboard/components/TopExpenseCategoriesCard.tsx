import { MaterialCommunityIcons } from '@expo/vector-icons';
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
                    icon={resolveIcon(cat.icon, 'tag-outline')}
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
