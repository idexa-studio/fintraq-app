import { SparklesIcon, Tag01Icon } from '@hugeicons/core-free-icons';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BentoPressable, EmptyState, IconAvatar, MoneyText, Text } from '@/src/components/ui';
import type { BiggestExpense, CategoryBreakdown } from '@/src/features/analytics/api/analytics';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';

type AnalyticsHighlightsProps = {
  topCategory: CategoryBreakdown | null;
  biggestExpense: BiggestExpense | null;
  currency: string;
  onOpenCategory: (categoryId: number) => void;
};

/** Top expense category and single biggest expense, each drilling into its transactions. */
export const AnalyticsHighlights = React.memo(function AnalyticsHighlights({
  topCategory,
  biggestExpense,
  currency,
  onOpenCategory,
}: AnalyticsHighlightsProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const rows = [
    topCategory && {
      key: 'top',
      meta: t('analytics.topCategory'),
      name: topCategory.name,
      amount: topCategory.amount,
      icon: resolveIcon(topCategory.icon, Tag01Icon),
      color: colorNumberToHex(topCategory.color),
      categoryId: topCategory.id,
    },
    biggestExpense && {
      key: 'biggest',
      meta: t('analytics.biggestExpense'),
      name: biggestExpense.note || biggestExpense.category,
      amount: biggestExpense.amount,
      icon: resolveIcon(biggestExpense.categoryIcon, SparklesIcon),
      color: colorNumberToHex(biggestExpense.categoryColor),
      categoryId: biggestExpense.categoryId,
    },
  ].filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (rows.length === 0) {
    return <EmptyState variant="inline" icon={SparklesIcon} title={t('analytics.noHighlights')} description={t('analytics.noHighlightsHint')} />;
  }

  return (
    <View style={styles.group}>
      {rows.map((row) => (
        <BentoPressable
          key={row.key}
          style={styles.row}
          onPress={() => onOpenCategory(row.categoryId)}
          accessibilityRole="button"
          accessibilityLabel={`${row.meta}: ${row.name}`}
        >
          <IconAvatar icon={row.icon} color={row.color} size={40} iconSize={18} />
          <View style={styles.body}>
            <Text variant="caption" tone="muted">
              {row.meta}
            </Text>
            <Text variant="bodyStrong" numberOfLines={1}>
              {row.name}
            </Text>
          </View>
          <MoneyText amount={row.amount} currency={currency} type="DR" compact style={styles.amount} />
        </BentoPressable>
      ))}
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    // Rows share one rounded group; the 2px gap reads as a divider without a line.
    group: { gap: 2, borderRadius: radius('xl'), overflow: 'hidden' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      padding: spacing('3.5'),
      backgroundColor: colors.surface,
    },
    body: { flex: 1, gap: 2 },
    amount: typography.metrics.sm,
  });
