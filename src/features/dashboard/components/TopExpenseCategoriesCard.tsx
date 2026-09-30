import { PieChart01Icon, Tag01Icon } from '@hugeicons/core-free-icons';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { EmptyState, IconAvatar } from '@/src/components/ui';
import { DotsThreeIcon } from '@/src/components/ui/icons';
import { ShareBreakdown, ShareItem } from '@/src/features/analytics/components/ShareBreakdown';
import type { CategorySpend } from '@/src/features/dashboard/api/dashboard';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';

type Props = {
  currency: string;
  categories: CategorySpend[];
  /** All expense this month; whatever the top categories don't cover shows as "Other". */
  monthExpense: number;
  onPressCategory: (id: number) => void;
};

/** This month's biggest categories as a share bar — the same breakdown Analytics uses. */
export const TopExpenseCategoriesCard = React.memo(function TopExpenseCategoriesCard({ currency, categories, monthExpense, onPressCategory }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const items = useMemo((): ShareItem[] => {
    const covered = categories.reduce((sum, c) => sum + c.amount, 0);
    // Shares are of the whole month, not just the top few, so the percentages mean what they say.
    const total = Math.max(monthExpense, covered);
    const shareOf = (amount: number) => (total > 0 ? amount / total : 0);

    const list = categories.map((c): ShareItem => {
      const color = colorNumberToHex(c.color);
      return {
        key: String(c.id),
        name: c.name,
        amount: c.amount,
        currency,
        share: shareOf(c.amount),
        color,
        type: 'DR',
        leading: <IconAvatar icon={resolveIcon(c.icon, Tag01Icon)} color={color} size={28} iconSize={13} />,
        onPress: () => onPressCategory(c.id),
      };
    });

    const other = total - covered;
    if (list.length > 0 && other > 0.005) {
      const muted = theme.colors.textMuted;
      list.push({
        key: 'other',
        name: t('dashboard.other'),
        amount: other,
        currency,
        share: shareOf(other),
        color: muted,
        type: 'DR',
        leading: <IconAvatar icon={DotsThreeIcon} color={muted} size={28} iconSize={13} />,
      });
    }
    return list;
  }, [categories, monthExpense, currency, onPressCategory, t, theme.colors.textMuted]);

  if (items.length === 0) {
    return (
      <EmptyState
        variant="inline"
        icon={PieChart01Icon}
        title={t('dashboard.noExpenses')}
        description={t('dashboard.expensesHint')}
        style={styles.padded}
      />
    );
  }

  return (
    <View style={styles.padded}>
      <ShareBreakdown items={items} />
    </View>
  );
});

const createStyles = ({ layout }: ThemeContextType) =>
  StyleSheet.create({
    padded: { marginHorizontal: layout.screenPadding },
  });
