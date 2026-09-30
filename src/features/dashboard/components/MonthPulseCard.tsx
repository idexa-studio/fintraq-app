import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { MoneyText, Skeleton, StatColumn, StatColumns, Text, TrendBadge } from '@/src/components/ui';
import { useMonthTotals } from '@/src/features/dashboard/hooks/dashboard';
import { buildMonthPulse } from '@/src/features/dashboard/utils/widgets';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = { currency: string };

/**
 * This month at a glance: spend so far against last month, drawn as a bar with a "today" tick so
 * the pace reads without any maths — fill past the tick means spending faster than the month is passing.
 */
export const MonthPulseCard = React.memo(function MonthPulseCard({ currency }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: totals, isLoading } = useMonthTotals(currency);

  const pulse = useMemo(() => (totals ? buildMonthPulse(totals, new Date()) : null), [totals]);

  if (isLoading || !pulse) return <Skeleton height={176} radius="xl" style={styles.margin} />;

  const share = pulse.shareOfLastMonth;
  // Over last month's total, or ahead of the calendar with a real baseline, is worth a warning colour.
  const barColor = share !== null && share >= 1 ? colors.danger : share !== null && share > pulse.monthProgress ? colors.warning : colors.primary;
  const fill = Math.min(1, share ?? 0);

  // Pace and the month-end forecast live in Analytics; home keeps the facts.
  const stats: StatColumn[] = [
    { key: 'income', label: t('dashboard.income'), amount: pulse.income, currency, type: 'CR' },
    { key: 'lastMonth', label: t('dashboard.pulseLastMonth'), amount: pulse.lastMonthTotal, currency },
  ];
  return (
    <View style={[styles.card, styles.margin]}>
      <View style={styles.header}>
        <Text variant="label" tone="muted">
          {t('dashboard.pulseSpent')}
        </Text>
        <Text variant="micro" tone="muted">
          {t('dashboard.pulseDay', { day: pulse.dayOfMonth, total: pulse.daysInMonth })}
        </Text>
      </View>

      <View style={styles.amountRow}>
        <MoneyText amount={pulse.expense} currency={currency} weight="bold" style={styles.amount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} />
        <TrendBadge delta={pulse.deltaVsLastMonth} positiveIsGood={false} />
      </View>

      {share !== null ? (
        <View style={styles.barBlock}>
          <View
            style={styles.track}
            accessibilityRole="progressbar"
            accessibilityLabel={t('dashboard.pulseOfLast', { pct: Math.round(share * 100) })}
            accessibilityValue={{ min: 0, max: 100, now: Math.round(fill * 100) }}
          >
            <View style={[styles.fill, { width: `${fill * 100}%`, backgroundColor: barColor }]} />
            <View style={[styles.todayTick, { left: `${pulse.monthProgress * 100}%` }]} />
          </View>
          <Text variant="caption" tone="muted">
            {t('dashboard.pulseOfLast', { pct: Math.round(share * 100) })}
          </Text>
        </View>
      ) : pulse.expense === 0 ? (
        <Text variant="caption" tone="muted">
          {t('dashboard.pulseEmpty')}
        </Text>
      ) : null}

      <StatColumns columns={stats} />
    </View>
  );
});

const TRACK = 10;

const createStyles = ({ colors, spacing, radius, layout, typography }: ThemeContextType) =>
  StyleSheet.create({
    margin: { marginHorizontal: layout.screenPadding },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      gap: spacing('3'),
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing('2'), marginTop: -spacing('1') },
    amount: { ...typography.metrics.xxl, flexShrink: 1 },
    barBlock: { gap: spacing('1.5') },
    track: {
      height: TRACK,
      borderRadius: radius('full'),
      backgroundColor: colors.card,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: radius('full') },
    // A notch in the track at today's position in the month.
    todayTick: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 2,
      marginLeft: -1,
      backgroundColor: colors.text,
    },
  });
