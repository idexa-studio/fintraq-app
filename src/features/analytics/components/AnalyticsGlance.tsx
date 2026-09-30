import { SparklesIcon, Tag01Icon } from '@hugeicons/core-free-icons';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { StatTile } from '@/src/components/ui';
import { CalendarBlankIcon, ChartBarIcon } from '@/src/components/ui/icons';
import type { BiggestExpense, CategoryBreakdown } from '@/src/features/analytics/api/analytics';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';

type Props = {
  currency: string;
  topCategory: CategoryBreakdown | null;
  biggestExpense: BiggestExpense | null;
  dailyAverage: number;
  /** Names the period the daily average covers, e.g. "30D". */
  periodLabel: string;
  /** Projected spend for the whole calendar month; null until this month has data. */
  monthProjection: number | null;
  onOpenCategory: (categoryId: number) => void;
};

/** Four equal tiles — highlights and pace — so the section reads as one balanced block. */
export const AnalyticsGlance = React.memo(function AnalyticsGlance({
  currency,
  topCategory,
  biggestExpense,
  dailyAverage,
  periodLabel,
  monthProjection,
  onOpenCategory,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <StatTile
          label={t('analytics.topCategory')}
          icon={topCategory ? resolveIcon(topCategory.icon, Tag01Icon) : Tag01Icon}
          iconColor={topCategory ? colorNumberToHex(topCategory.color) : colors.textMuted}
          amount={topCategory?.amount ?? 0}
          currency={currency}
          caption={topCategory?.name ?? '—'}
          compact
          onPress={topCategory ? () => onOpenCategory(topCategory.id) : undefined}
        />
        <StatTile
          label={t('analytics.biggestExpense')}
          icon={biggestExpense ? resolveIcon(biggestExpense.categoryIcon, SparklesIcon) : SparklesIcon}
          iconColor={biggestExpense ? colorNumberToHex(biggestExpense.categoryColor) : colors.textMuted}
          amount={biggestExpense?.amount ?? 0}
          currency={currency}
          caption={biggestExpense ? biggestExpense.note || biggestExpense.category : '—'}
          compact
          onPress={biggestExpense ? () => onOpenCategory(biggestExpense.categoryId) : undefined}
        />
      </View>
      <View style={styles.row}>
        <StatTile label={t('analytics.dailyAvg')} icon={CalendarBlankIcon} iconColor={colors.info} amount={dailyAverage} currency={currency} caption={periodLabel} compact />
        <StatTile
          label={t('analytics.monthEndForecast')}
          icon={ChartBarIcon}
          iconColor={colors.warning}
          amount={monthProjection ?? 0}
          currency={currency}
          caption={t('dashboard.thisMonth')}
          compact
        />
      </View>
    </View>
  );
});

const createStyles = ({ spacing }: ThemeContextType) =>
  StyleSheet.create({
    grid: { gap: spacing('2') },
    row: { flexDirection: 'row', gap: spacing('2') },
  });
