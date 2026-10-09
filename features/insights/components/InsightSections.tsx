import type { DashboardInsight } from '@/data/repositories/insights';
import { BarChart, Card, Chip, Delta, HeatGrid, IconCircle, Money, Notice, PASTELS, PaceBar, ProgressBar, RankBars, Ring, Stat, Text, Touchable, resolveIcon, useStyles, useTheme } from '@/design';
import type { Theme } from '@/design';
import type { useInsights } from '@/features/insights/hooks/useInsights';
import { peakIndex } from '@/features/insights/insights-rules';
import type { ChartRun, PeriodDays } from '@/features/insights/insights-rules';
import { initialsOf } from '@/features/people';
import { formatDate, parseDateKey } from '@/shared/date/date';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type Insights = ReturnType<typeof useInsights>;
type Common = { insights: Insights; currency: string };

const firstOf = (slot: string) => parseDateKey(slot.length === 7 ? `${slot}-01` : slot);

/** A short name for each bar, sparse enough to fit: a weekday, a week's first day, a month. */
function barLabels(runs: readonly ChartRun[], period: PeriodDays): string[] {
  return runs.map((run, i) => {
    const start = firstOf(run.start);
    if (period === 7) return formatDate(start, { weekday: 'short' });
    if (period === 30) return formatDate(start, { day: 'numeric', month: 'short' });
    if (period === 365) return formatDate(start, { month: 'narrow' });
    // Thirteen weekly bars are too narrow for a name each: the month's letter, only where it changes.
    const previous = i > 0 ? firstOf(runs[i - 1]!.start).getMonth() : -1;
    return start.getMonth() === previous ? '' : formatDate(start, { month: 'narrow' });
  });
}

/** The period's headline: what was spent, the chart behind it, then in and out. With Pro, how it compares with the period before. */
export function PeriodSummary({ insights, currency, period, compare }: Common & { period: PeriodDays; compare: boolean }) {
  const { t } = useTranslation('insights');
  const styles = useStyles(createStyles);
  const key = `d${period}` as const;
  const money = (amount: number) => formatCurrency(amount, currency);
  const values = insights.runs.map((run) => run.value);
  const peak = peakIndex(values);
  const peakRun = peak === undefined ? null : insights.runs[peak]!;
  const peakWhen = peakRun
    ? period === 365
      ? formatDate(firstOf(peakRun.start), { month: 'long' })
      : period === 7
        ? formatDate(firstOf(peakRun.start), { weekday: 'long' })
        : t('summary.week', { date: formatDate(firstOf(peakRun.start), { day: 'numeric', month: 'long' }) })
    : '';
  const change = insights.change;
  const percent = change === null ? 0 : Math.round(Math.abs(change));

  return (
    <Card style={styles.card}>
      <View style={styles.tight}>
        <Text variant="callout" tone="muted">{t(`summary.spent.${key}`)}</Text>
        <Money value={money(insights.totals.expense)} variant="amountHero" />
        {compare && change !== null ? (
          // Spending less is the welcome direction.
          <Delta
            direction={percent === 0 ? 'flat' : change < 0 ? 'down' : 'up'}
            good={change <= 0}
            label={percent === 0 ? t('summary.same', { period: t(`summary.before.${key}`) }) : t(change < 0 ? 'summary.less' : 'summary.more', { percent, period: t(`summary.before.${key}`) })}
          />
        ) : null}
      </View>
      <BarChart
        bars={insights.runs.map((run, i) => ({ label: barLabels(insights.runs, period)[i]!, value: run.value }))}
        highlight={peak}
        accessibilityLabel={peakRun ? t('summary.chart', { amount: money(peakRun.value), when: peakWhen }) : t('summary.chartEmpty')}
      />
      <View style={styles.stats}>
        <Stat label={t('summary.moneyIn')} value={money(insights.totals.income)} tone="positive" />
        <Stat label={t('summary.moneyOut')} value={money(insights.totals.expense)} />
      </View>
    </Card>
  );
}

/** This month's spending so far and where its pace leads, against last month. */
export function Forecast({ insights, currency }: Common) {
  const { t } = useTranslation('insights');
  const styles = useStyles(createStyles);
  const { pulse, pace } = insights;
  if (!pulse) return null;
  const money = (amount: number) => formatCurrency(amount, currency);
  const now = new Date();
  return (
    <Card style={styles.card}>
      <View style={styles.tight}>
        <Text variant="callout" tone="muted">{t('forecast.onCourse')}</Text>
        <Money value={money(pulse.projected)} variant="amountLarge" />
        <Text variant="callout" tone="muted">{t('forecast.perDay', { amount: money(pulse.dailyAverage) })}</Text>
      </View>
      {pace ? (
        <PaceBar
          spent={pace.spent}
          projected={pace.projected}
          today={pace.today}
          startLabel={t('forecast.start', { month: formatDate(now, { month: 'short' }) })}
          endLabel={t('forecast.end', { amount: money(pulse.lastMonthTotal) })}
          todayLabel={t('forecast.today')}
          accessibilityLabel={t('forecast.chart', { spent: Math.round(pace.spent * 100), gone: Math.round(pace.today * 100), projected: Math.round(pace.projected * 100) })}
        />
      ) : (
        <Text variant="callout" tone="muted">{t('forecast.noBaseline')}</Text>
      )}
    </Card>
  );
}

const SHADES = [PASTELS.teal, PASTELS.orange, PASTELS.pink, PASTELS.lilac, PASTELS.green];

/**
 * Where the money went, largest first. Without Pro: the top few spending
 * categories. With Pro: spending or income, all of it, around a ring of
 * shares. Each one opens its transactions.
 */
export function Categories({ insights, currency, full, limit, onOpen, budgetNote }: Common & { full: boolean; limit: number; onOpen: (categoryId: number) => void; /** What a category's budget has left this month, in words, for those that have one. */ budgetNote?: (categoryId: number) => string | null }) {
  const { t } = useTranslation('insights');
  const { size } = useTheme();
  const styles = useStyles(createStyles);
  const [kind, setKind] = useState<'spending' | 'income'>('spending');
  const shown = full && kind === 'income' ? insights.income : insights.spending;
  const total = full && kind === 'income' ? insights.totals.income : insights.totals.expense;
  const money = (amount: number) => formatCurrency(amount, currency);
  const mark = size.iconCircleSmall;
  const percentOf = (share: number) => Math.round(share * 100);

  if (!full) {
    const top = shown.slice(0, limit);
    if (top.length === 0) return <Card><Text variant="callout" tone="muted">{t('categories.none')}</Text></Card>;
    return (
      <Card style={styles.list}>
        {top.map((category) => (
          <Touchable key={category.id} onPress={() => onOpen(category.id)} accessibilityLabel={`${category.name}, ${money(category.amount)}`} style={styles.topRow}>
            <View style={styles.topHead}>
              <IconCircle icon={resolveIcon(category.icon, 'tag')} color={colorNumberToHex(category.color)} size={mark} />
              <Text variant="bodyStrong" numberOfLines={1} style={styles.fill}>{category.name}</Text>
              <Money value={money(category.amount)} />
            </View>
            <ProgressBar value={category.share} accessibilityLabel={t('categories.shareLabel', { name: category.name, percent: percentOf(category.share) })} />
            {budgetNote?.(category.id) ? <Text variant="callout" tone="muted">{budgetNote(category.id)}</Text> : null}
          </Touchable>
        ))}
      </Card>
    );
  }

  // The ring names the largest few and gathers the rest, so it stays readable.
  const leaders = shown.slice(0, SHADES.length - 1);
  const rest = shown.slice(SHADES.length - 1).reduce((sum, category) => sum + category.amount, 0);
  const segments = [...leaders.map((category, i) => ({ value: category.amount, color: SHADES[i]! })), ...(rest > 0 ? [{ value: rest, color: SHADES[SHADES.length - 1]! }] : [])];

  return (
    <Card style={styles.card}>
      <View style={styles.kinds} accessibilityRole="radiogroup" accessibilityLabel={t('categories.kind')}>
        <Chip label={t('categories.spending')} selected={kind === 'spending'} onPress={() => setKind('spending')} />
        <Chip label={t('categories.income')} selected={kind === 'income'} onPress={() => setKind('income')} />
      </View>
      {shown.length === 0 ? (
        <Text variant="callout" tone="muted">{t('categories.none')}</Text>
      ) : (
        <>
          <View style={styles.centre}>
            <Ring segments={segments} size={size.ring} accessibilityLabel={t('categories.ring', { kind: t(`categories.${kind}`) })}>
              <Text variant="callout" tone="muted">{kind === 'income' ? t('categories.received') : t('categories.spent')}</Text>
              <Money value={money(total)} variant="amountLarge" />
            </Ring>
          </View>
          <RankBars
            items={shown.map((category) => ({
              key: String(category.id),
              label: category.name,
              value: category.amount,
              display: money(category.amount),
              note: t('categories.share', { percent: percentOf(category.share) }),
              caption: (kind === 'spending' ? budgetNote?.(category.id) : null) ?? undefined,
              leading: <IconCircle icon={resolveIcon(category.icon, 'tag')} color={colorNumberToHex(category.color)} size={mark} />,
              onPress: () => onOpen(category.id),
            }))}
          />
        </>
      )}
    </Card>
  );
}

/** When the money goes: what a typical week costs day by day, then the last five weeks as a calendar. */
export function Rhythm({ insights }: Pick<Common, 'insights'>) {
  const { t } = useTranslation('insights');
  const styles = useStyles(createStyles);
  // Any Monday to Sunday serves to name the weekdays.
  const dayName = (dow: number, width: 'short' | 'long' | 'narrow') => formatDate(new Date(2024, 0, 7 + dow), { weekday: width });
  const peak = peakIndex(insights.weekdays.map((day) => day.total));
  return (
    <>
      <Card style={styles.card}>
        <Text variant="bodyStrong">{t('rhythm.weekdays')}</Text>
        <BarChart
          bars={insights.weekdays.map((day) => ({ label: dayName(day.dow, 'short'), value: day.total }))}
          highlight={peak}
          accessibilityLabel={peak === undefined ? t('rhythm.weekdaysChartEmpty') : t('rhythm.weekdaysChart', { peak: dayName(insights.weekdays[peak]!.dow, 'long') })}
        />
      </Card>
      <Card style={styles.card}>
        <Text variant="bodyStrong">{t('rhythm.calendar')}</Text>
        <HeatGrid values={insights.heat.values} columns={[1, 2, 3, 4, 5, 6, 0].map((dow) => dayName(dow, 'narrow'))} highlight={insights.heat.today} accessibilityLabel={t('rhythm.calendarChart')} />
      </Card>
    </>
  );
}

/** Who the spending was with, largest first. Each one opens that person. */
export function PeopleShare({ insights, currency, onOpen }: Common & { onOpen: (personId: number) => void }) {
  const { size } = useTheme();
  if (insights.people.length === 0) return null;
  return (
    <Card>
      <RankBars
        items={insights.people.map((person) => ({
          key: String(person.id),
          label: person.name,
          value: person.amount,
          display: formatCurrency(person.amount, currency),
          leading: <IconCircle initials={initialsOf(person.name)} color={colorNumberToHex(person.color)} size={size.iconCircleSmall} />,
          onPress: () => onOpen(person.id),
        }))}
      />
    </Card>
  );
}

const TONE = { success: 'positive', danger: 'danger', warning: 'warning', info: 'info' } as const;

/** Patterns worth a sentence, each with the figure that backs it. */
export function Findings({ findings }: { findings: readonly DashboardInsight[] }) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.list}>
      {findings.map((finding) => <Notice key={finding.id} tone={TONE[finding.type]} title={finding.title} body={finding.subtitle} />)}
    </View>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    card: { gap: space.xl },
    tight: { gap: space.xs },
    list: { gap: space.lg },
    stats: { flexDirection: 'row', gap: space.lg },
    kinds: { flexDirection: 'row', gap: space.sm },
    centre: { alignItems: 'center' },
    fill: { flex: 1 },
    topRow: { gap: space.sm },
    topHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  });
