import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BentoPressable, Skeleton, Text } from '@/src/components/ui';
import { DOW_KEYS, MONTH_KEYS } from '@/shared/date/calendar';
import { useDailySpend } from '@/src/features/dashboard/hooks/dashboard';
import { buildHeatmap, HeatCell, HeatLevel, heatmapStart } from '@/shared/calc/month';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { getLocalISOString } from '@/shared/date/date';
import { magnitudeRamp } from '@/src/theme/chart';
import { formatCurrency } from '@/shared/format/money';

type Props = { currency: string };

/** Monday-first column order, as indices into the Sunday-first DOW_KEYS. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const LEVELS: readonly HeatLevel[] = [0, 1, 2, 3, 4];

/**
 * The last five weeks as a calendar, each day shaded by how much went out. Tapping a day shows its
 * total in the header, so the grid doubles as a quick lookup.
 */
export const SpendingHeatmap = React.memo(function SpendingHeatmap({ currency }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Keyed by the calendar day so a screen left open past midnight rolls over on its next render.
  const todayKey = getLocalISOString();
  const today = useMemo(() => {
    const [y, m, d] = todayKey.split('-').map(Number) as [number, number, number];
    return new Date(y, m - 1, d);
  }, [todayKey]);
  const since = useMemo(() => heatmapStart(today), [today]);
  const { data: spend, isLoading } = useDailySpend(currency, since);

  const grid = useMemo(() => buildHeatmap(spend ?? new Map(), today), [spend, today]);
  const todayCell = useMemo(() => grid.flat().find((c) => c.isToday) ?? null, [grid]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selected = grid.flat().find((c) => c.date === selectedDate) ?? todayCell;

  const levelColor = useMemo(() => {
    const ramp = magnitudeRamp(theme.colors);
    return { 0: ramp.none, 1: ramp.low, 2: ramp.mid, 3: ramp.high, 4: ramp.peak } satisfies Record<HeatLevel, string>;
  }, [theme]);

  const describe = (cell: HeatCell) => {
    const [y, m, d] = cell.date.split('-').map(Number) as [number, number, number];
    const day = new Date(y, m - 1, d);
    const name = `${t(`calendar.days.${DOW_KEYS[day.getDay()]!}`)}, ${d} ${t(`calendar.months.${MONTH_KEYS[m - 1]!}`)}`;
    const amount = cell.amount > 0 ? t('dashboard.rhythmSpent', { amount: formatCurrency(cell.amount, currency) }) : t('dashboard.rhythmNone');
    return { name, amount };
  };

  if (isLoading) return <Skeleton height={236} radius="xl" />;

  const summary = selected ? describe(selected) : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="calloutStrong" numberOfLines={1}>
            {summary?.name ?? t('dashboard.rhythmHint')}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {summary?.amount}
          </Text>
        </View>
        <View style={styles.legend} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text variant="micro" tone="muted">
            {t('dashboard.rhythmLess')}
          </Text>
          {LEVELS.map((level) => (
            <View key={level} style={[styles.legendSwatch, { backgroundColor: levelColor[level] }]} />
          ))}
          <Text variant="micro" tone="muted">
            {t('dashboard.rhythmMore')}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        {WEEK_ORDER.map((dow) => (
          <Text key={dow} variant="micro" tone="muted" align="center" style={styles.cellSlot}>
            {t(`calendar.daysShort.${DOW_KEYS[dow]!}`)}
          </Text>
        ))}
      </View>

      <View style={styles.weeks}>
        {grid.map((week) => (
          <View key={week[0]!.date} style={styles.row}>
            {week.map((cell) => {
              if (cell.isFuture) return <View key={cell.date} style={[styles.cellSlot, styles.cell, styles.future]} />;
              const isSelected = cell.date === selected?.date;
              const { name, amount } = describe(cell);
              return (
                <BentoPressable
                  key={cell.date}
                  scaleOnPress={false}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSelectedDate(cell.date);
                  }}
                  style={[
                    styles.cellSlot,
                    styles.cell,
                    { backgroundColor: levelColor[cell.level] },
                    cell.isToday && styles.today,
                    isSelected && styles.selected,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${name}, ${amount}`}
                  accessibilityState={{ selected: isSelected }}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, alpha }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      gap: spacing('2'),
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing('3'), marginBottom: spacing('1') },
    headerText: { flex: 1 },
    legend: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    legendSwatch: { width: 10, height: 10, borderRadius: radius('xs') },
    weeks: { gap: spacing('1.5') },
    row: { flexDirection: 'row', gap: spacing('1.5') },
    cellSlot: { flex: 1 },
    cell: { aspectRatio: 1.35, borderRadius: radius('sm') },
    future: { backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: alpha(colors.text, 'subtle') },
    today: { borderWidth: 2, borderColor: colors.textMuted },
    selected: { borderWidth: 2, borderColor: colors.primary },
  });
