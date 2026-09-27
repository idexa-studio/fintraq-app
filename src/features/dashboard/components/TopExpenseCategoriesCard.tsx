import { Text } from '@/src/components/ui/Text';
import { PieChart01Icon, Tag01Icon } from '@hugeicons/core-free-icons';
import { EmptyState } from '@/src/components/ui/EmptyState';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';


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
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: screenWidth } = useWindowDimensions();
  // Two per row: an odd last tile keeps its size instead of stretching.
  const tileWidth = (screenWidth - theme.layout.screenPadding * 2 - theme.spacing('2.5')) / 2;

  const items = categories.slice(0, 6);

  const totalAmount = useMemo(() => {
    return categories.reduce((sum, cat) => sum + cat.amount, 0);
  }, [categories]);

  if (items.length === 0) {
    return (
      <EmptyState variant="inline" icon={PieChart01Icon} title={t('dashboard.noExpenses')} description={t('dashboard.expensesHint')} style={styles.padded} />
    );
  }

  return (
    <View style={[styles.grid, styles.padded]}>
      {items.map((cat) => {
        const accent = colorNumberToHex(cat.color);
        const pct = totalAmount > 0 ? Math.round((cat.amount / totalAmount) * 100) : 0;

        return (
          <View key={cat.name} style={[styles.tile, { width: tileWidth }]}>
            <IconAvatar icon={resolveIcon(cat.icon, Tag01Icon)} color={accent} size={36} />
            <View style={styles.body}>
              <Text variant="calloutStrong" numberOfLines={1}>{cat.name}</Text>
              <View style={styles.amountRow}>
                <MoneyText amount={cat.amount} currency={currency} type="DR" weight="medium" compact style={styles.amount} />
                {pct > 0 ? <Text variant="micro" tone="muted">· {pct}%</Text> : null}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) => {
  const gap = spacing('2.5');
  return StyleSheet.create({
    padded: { marginHorizontal: layout.screenPadding },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap },
    tile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      padding: spacing('3'),
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
    },
    body: { flex: 1, gap: spacing('0.5') },
    amountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing('1') },
    amount: { ...typography.metrics.xs },
  });
};
