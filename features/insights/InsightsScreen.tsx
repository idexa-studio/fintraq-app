import { Chip, ChipRow, EmptyState, Header, LockedCard, Screen, Section, Select, Skeleton, useStyles, useTheme } from '@/design';
import type { Theme } from '@/design';
import { useAccounts } from '@/features/accounts';
import { useBudgets } from '@/features/budgets';
import { INSIGHTS_OPENED, useSeen } from '@/features/guide';
import { useDashboardInsights } from '@/features/home';
import { Categories, Findings, Forecast, PeopleShare, PeriodSummary, Rhythm } from '@/features/insights/components/InsightSections';
import { useInsights } from '@/features/insights/hooks/useInsights';
import { DEFAULT_PERIOD, FREE_CATEGORIES, PERIODS, allowedPeriod, findingsToShow } from '@/features/insights/insights-rules';
import type { PeriodDays } from '@/features/insights/insights-rules';
import { PRO_FEATURES, featuresIn, usePro, useProCopy } from '@/features/pro';
import { useSettings } from '@/features/settings';
import { useTransactionsCount } from '@/features/transactions';
import { currencyName, sortCurrenciesWithDefault } from '@/shared/currency/currencies';
import { formatCurrency } from '@/shared/format/money';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/** What Pro adds to this tab, named from the registry. */
const PRO_HERE = featuresIn('understand', 'live');

/**
 * The Insights tab. Home says where you stand; this says why: how much went,
 * where, when and with whom. Free shows the period and its top categories;
 * Pro adds longer periods, the comparison, the forecast, the full breakdown,
 * the rhythm, people and findings, all named on one card for free users.
 */
export function InsightsScreen() {
  const { t } = useTranslation(['insights', 'common']);
  const { size } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const { profile } = useSettings();
  const { isPro, openPaywall } = usePro();
  const proCopy = useProCopy();
  const { data: accounts } = useAccounts();
  const { data: recorded } = useTransactionsCount();
  const { data: budgets } = useBudgets();
  const { seen, markSeen } = useSeen();
  // Opening this tab with something to show is Home's "see where your money goes" step.
  const opened = seen !== undefined && (recorded ?? 0) > 0;
  useEffect(() => {
    if (opened) markSeen(INSIGHTS_OPENED);
  }, [opened, markSeen]);

  const currencies = useMemo(() => sortCurrenciesWithDefault([...new Set([profile.defaultCurrency, ...(accounts ?? []).map((a) => a.currency)])], profile.defaultCurrency), [accounts, profile.defaultCurrency]);
  const [chosenCurrency, setCurrency] = useState<string | null>(null);
  const currency = chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0]!;

  const [chosenPeriod, setPeriod] = useState<PeriodDays>(DEFAULT_PERIOD);
  const period = allowedPeriod(chosenPeriod, isPro);
  const insights = useInsights(currency, period);
  const { data: allFindings } = useDashboardInsights(currency);

  const header = <Header title={t('title')} right={currencies.length > 1 ? <Select title={t('common:pickCurrency')} options={currencies.map((code) => ({ key: code, label: code, detail: currencyName(code) }))} value={currency} onChange={setCurrency} accessibilityLabel={t('currency')} /> : undefined} />;
  // A budget is for the calendar month, whatever period is shown, so its note says "this month".
  const budgetNote = (categoryId: number) => {
    const budget = (budgets ?? []).find((item) => item.categoryId === categoryId && item.currency === currency);
    if (!budget) return null;
    const left = budget.limit - budget.spent;
    return left >= 0 ? t('budget.left', { amount: formatCurrency(left, currency) }) : t('budget.over', { amount: formatCurrency(-left, currency) });
  };
  // A budget under four fifths used has room: its category's rise in a week is not flagged as well.
  const withRoom = new Set((budgets ?? []).filter((item) => item.categoryId !== null && item.currency === currency && item.limit > 0 && item.spent / item.limit < 0.8).map((item) => item.categoryId as number));
  const findings = findingsToShow(allFindings ?? [], period, withRoom);
  const openCategory = (categoryId: number) => router.push({ pathname: '/activity', params: { categoryId, from: insights.window.start, to: insights.window.end } });

  if (recorded === undefined || insights.loading) {
    return (
      <Screen tabbed header={header}>
        <Skeleton height={size.chip} width="60%" />
        <Skeleton height={size.row * 5} />
        <Skeleton height={size.row * 3} />
      </Screen>
    );
  }

  // Nothing recorded yet: say what this tab will show instead of a page of empty charts.
  if (recorded === 0) {
    return (
      <Screen tabbed scroll={false} header={header}>
        <View style={styles.centre}>
          <EmptyState icon="chart-line-data" title={t('empty.title')} body={t('empty.body')} actionLabel={t('empty.action')} onAction={() => router.push('/add')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen tabbed header={header}>
      {/* Only with Pro is there a period to choose: without it the one period is named by the summary, and the longer ones on the Pro card. */}
      {isPro ? (
        <View style={styles.periods}>
          <ChipRow>
            {PERIODS.map((option) => (
              <Chip key={option.days} label={t(`periods.d${option.days}`)} selected={option.days === period} onPress={() => setPeriod(option.days)} />
            ))}
          </ChipRow>
        </View>
      ) : null}

      <PeriodSummary insights={insights} currency={currency} period={period} compare={isPro} />

      {isPro ? (
        <Section title={t('forecast.title')} hint={t('forecast.hint')}>
          <Forecast insights={insights} currency={currency} />
        </Section>
      ) : null}

      <Section title={t('categories.title')} hint={t('categories.hint')}>
        <Categories budgetNote={budgetNote} insights={insights} currency={currency} full={isPro} limit={FREE_CATEGORIES} onOpen={openCategory} onMore={() => openPaywall('categories')} />
      </Section>

      {isPro ? (
        <>
          <Section title={t('rhythm.title')} hint={t('rhythm.hint')}>
            <View style={styles.stack}><Rhythm insights={insights} typicalWeek={period > 7} /></View>
          </Section>
          {insights.people.length > 0 ? (
            <Section title={t('people.title')} hint={t('people.hint')}>
              <PeopleShare insights={insights} currency={currency} onOpen={(id) => router.push({ pathname: '/people/[id]', params: { id } })} />
            </Section>
          ) : null}
          {findings.length > 0 ? (
            <Section title={t('findings.title')} hint={t('findings.hint')}>
              <Findings findings={findings} />
            </Section>
          ) : null}
        </>
      ) : (
        <LockedCard
          badge={t('locked.badge')}
          title={t('locked.title')}
          body={t('locked.body')}
          items={PRO_HERE.map((id) => ({ icon: PRO_FEATURES[id].icon, title: proCopy.feature(id).title, detail: proCopy.feature(id).description }))}
          actionLabel={t('locked.action')}
          onAction={() => openPaywall('periods')}
        />
      )}
    </Screen>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    centre: { flex: 1, justifyContent: 'center' },
    // The chips run to the screen's edges, past the page margin.
    periods: { marginHorizontal: -size.screenPadding },
    stack: { gap: space.lg },
  });
