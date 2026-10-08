import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, IconAvatar, PersonAvatar, Screen, SectionHeader, SegmentedControl, Skeleton, Text } from '@/src/components/ui';
import { DEFAULT_CURRENCY, sortCurrenciesWithDefault } from '@/shared/currency/currencies';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { AnalyticsControls } from '@/src/features/analytics/components/AnalyticsControls';
import { AnalyticsGlance } from '@/src/features/analytics/components/AnalyticsGlance';
import { DowChart } from '@/src/features/analytics/components/DowChart';
import { InsightsCarousel } from '@/src/features/analytics/components/InsightsCarousel';
import { PeriodSummaryCard } from '@/src/features/analytics/components/PeriodSummaryCard';
import { ShareBreakdown, ShareItem } from '@/src/features/analytics/components/ShareBreakdown';
import { SpendingHeatmap } from '@/src/features/analytics/components/SpendingHeatmap';
import { SpendingTrendChart } from '@/src/features/analytics/components/SpendingTrendChart';
import { ANALYTICS_RANGES, FREE_RANGE_DAYS, RangeDays } from '@/src/features/analytics/constants';
import { useAnalyticsOverview } from '@/src/features/analytics/hooks/useAnalyticsOverview';
import { useTransactionsCount } from '@/src/features/transactions/hooks/transactions';
import { useMonthTotals } from '@/src/features/dashboard/hooks/dashboard';
import { buildMonthPulse } from '@/shared/calc/month';
import { ProPreviewCard } from '@/src/features/premium/components/ProPreviewCard';
import { useProAccess } from '@/src/features/premium/hooks/useProAccess';
import { useSettings } from '@/features/settings';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { AccountType } from '@/shared/types';
import { withShares } from '@/shared/calc/analytics';
import { colorNumberToHex } from '@/shared/format/color';
import { resolveAccountTypeIcon, resolveIcon } from '@/src/utils/icons';

type CategoryTab = 'expense' | 'income';

/** Free users see this many top expense categories; the full breakdown is Pro. */
const FREE_CATEGORY_COUNT = 3;

/**
 * The "why" tab — Home shows where you stand, this explains it: how much, where it went, when, and with whom.
 * Free: summary, trend, top expense categories and spending rhythm, then one card naming what Pro adds.
 * Pro: adds highlights and forecast, insights, the full category breakdown, weekly pattern, people and balances.
 */
const EMPTY_FEATURES = [
  { key: 'trend', icon: 'chart-bar' },
  { key: 'categories', icon: 'chart-pie' },
  { key: 'forecast', icon: 'trending-up-down' },
] as const;

export const AnalyticsScreen = React.memo(function AnalyticsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);
  const router = useRouter();
  const { isPremium, openPaywall } = useProAccess();
  const { profile } = useSettings();
  const { data: accounts = [] } = useAccounts();

  const currencies = useMemo(() => {
    const unique = Array.from(new Set(accounts.map((a) => a.currency)));
    return sortCurrenciesWithDefault(unique.length > 0 ? unique : [DEFAULT_CURRENCY], profile.defaultCurrency);
  }, [accounts, profile.defaultCurrency]);

  const [chosenCurrency, setCurrency] = useState<string | null>(null);
  // Falls back when the choice disappears (e.g. its last account was deleted).
  const currency = chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0]!;
  const [chosenRange, setRange] = useState<RangeDays>(FREE_RANGE_DAYS);
  // A longer range picked while Pro stays valid only while Pro is (a refund drops back to free).
  const range = isPremium ? chosenRange : FREE_RANGE_DAYS;
  const [categoryTab, setCategoryTab] = useState<CategoryTab>('expense');

  const overview = useAnalyticsOverview(currency, range);
  const { data: txCount } = useTransactionsCount();
  const { data: month } = useMonthTotals(currency);
  const monthProjection = month ? buildMonthPulse(month, new Date()).projected : null;

  const openLockedRange = useCallback(() => openPaywall('analytics'), [openPaywall]);
  const openLockedCategories = useCallback(() => openPaywall('categories'), [openPaywall]);
  const openCategory = useCallback((categoryId: number) => router.push(`/transactions?categoryId=${categoryId}`), [router]);

  // Free users get the top few expense categories only, so the tab is pinned to expenses.
  const activeTab: CategoryTab = isPremium ? categoryTab : 'expense';
  const categoryItems = useMemo((): ShareItem[] => {
    const type = activeTab === 'expense' ? 'DR' : 'CR';
    const source = activeTab === 'expense' ? overview.expenseCategories : overview.incomeCategories;
    // Shares of the period's whole spending (or income), so they match the summary card.
    const shared = withShares(source, activeTab === 'expense' ? overview.totals.expense : overview.totals.income);
    return (isPremium ? shared : shared.slice(0, FREE_CATEGORY_COUNT)).map((c) => {
      const color = colorNumberToHex(c.color);
      return {
        key: String(c.id),
        name: c.name,
        amount: c.amount,
        currency,
        share: c.share,
        color,
        type,
        leading: <IconAvatar icon={resolveIcon(c.icon, 'tag')} color={color} size={28} iconSize={13} />,
        onPress: () => openCategory(c.id),
      };
    });
  }, [activeTab, isPremium, overview.expenseCategories, overview.incomeCategories, overview.totals, currency, openCategory]);

  const personItems = useMemo(
    (): ShareItem[] =>
      withShares(overview.people).map((p) => {
        const color = colorNumberToHex(p.color);
        return {
          key: String(p.id),
          name: p.name,
          amount: p.amount,
          currency,
          share: p.share,
          color,
          type: 'DR',
          leading: <PersonAvatar name={p.name} color={color} size={28} />,
          onPress: () => router.push(`/persons/${p.id}`),
        };
      }),
    [overview.people, currency, router],
  );

  const accountItems = useMemo(
    (): ShareItem[] =>
      withShares(accounts.filter((a) => a.currency === currency).map((a) => ({ ...a, amount: a.balance })))
        .sort((a, b) => b.amount - a.amount)
        .map((a) => {
          const color = colorNumberToHex(a.color);
          return {
            key: String(a.id),
            name: a.name,
            amount: a.amount,
            currency: a.currency,
            share: a.share,
            color,
            leading: <IconAvatar icon={resolveAccountTypeIcon(a.accountType as AccountType | null)} color={color} size={28} iconSize={13} />,
            onPress: () => router.push(`/(main)/accounts/${a.id}`),
          };
        }),
    [accounts, currency, router],
  );

  const categoryTabs = useMemo(
    () => [
      { value: 'expense' as const, label: t('analytics.expenses') },
      { value: 'income' as const, label: t('analytics.income') },
    ],
    [t],
  );

  const rangeLabel = ANALYTICS_RANGES.find((r) => r.days === range)?.label ?? '';
  const header = { title: t('common.analyticsTitle') };

  if (overview.isLoading) {
    return (
      <Screen header={header} variant="fixed" edges={['top']}>
        {/* Mirrors the real layout so the page doesn't jump from a blank list to cards. */}
        <View style={styles.content}>
          <Skeleton height={34} radius="full" />
          <View style={styles.skeletonRow}>
            <Skeleton height={112} radius="xl" style={styles.flex} />
            <Skeleton height={112} radius="xl" style={styles.flex} />
          </View>
          <Skeleton height={72} radius="xl" />
          <Skeleton height={220} radius="xl" />
        </View>
      </Screen>
    );
  }

  // Nothing recorded yet: say what this tab will show instead of a page of zero charts.
  if (txCount === 0) {
    return (
      <Screen header={header} variant="fixed" edges={['top']}>
        <ScrollView contentContainerStyle={[styles.content, styles.emptyContent]} showsVerticalScrollIndicator={false}>
          <EmptyState
            icon="chart-line-data"
            title={t('analytics.emptyTitle')}
            description={t('analytics.emptyHint')}
            actionLabel={t('dashboard.addTransaction')}
            onAction={() => router.push('/transactions/create')}
          />
          <View style={styles.emptyFeatures}>
            {EMPTY_FEATURES.map((f) => (
              <View key={f.key} style={styles.emptyFeature}>
                <IconAvatar icon={f.icon} color={theme.colors.primaryInk} size={40} />
                <View style={styles.emptyFeatureText}>
                  <Text variant="bodyStrong">{t(`analytics.emptyFeatures.${f.key}.title`)}</Text>
                  <Text variant="caption" tone="muted">{t(`analytics.emptyFeatures.${f.key}.hint`)}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen header={header} variant="fixed" edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AnalyticsControls
          currencies={currencies}
          currency={currency}
          onCurrencyChange={setCurrency}
          range={range}
          onRangeChange={setRange}
          window={overview.window}
          isPremium={isPremium}
          onLockedRange={openLockedRange}
        />

        <PeriodSummaryCard totals={overview.totals} deltas={overview.deltas} currency={currency} />

        {/* How much and where: the quick figures, the trend, then the categories behind it. */}
        {isPremium ? (
          <View>
            <SectionHeader title={t('analytics.highlights')} noPadding />
            <AnalyticsGlance
              currency={currency}
              topCategory={overview.topCategory}
              biggestExpense={overview.biggestExpense}
              dailyAverage={overview.dailyAverage}
              periodLabel={rangeLabel}
              monthProjection={monthProjection}
              onOpenCategory={openCategory}
            />
          </View>
        ) : null}

        <View>
          <SectionHeader title={t('analytics.trend')} rightText={`${rangeLabel} · ${currency}`} noPadding />
          {overview.chart.length === 0 ? (
            <EmptyState variant="inline" icon="chart-line-data" title={t('analytics.noTrend')} description={t('analytics.noTrendHint')} />
          ) : (
            <View style={styles.card}>
              <SpendingTrendChart data={overview.chart} currency={currency} />
            </View>
          )}
        </View>

        <View>
          {isPremium ? (
            <SectionHeader title={t('analytics.categoryBreakdown')} rightText={t('analytics.groupsCount', { count: categoryItems.length })} noPadding />
          ) : (
            <SectionHeader title={t('dashboard.topExpenses')} rightText={t('dashboard.seeAll')} onPressRight={openLockedCategories} noPadding />
          )}
          <View style={styles.stack}>
            {isPremium ? <SegmentedControl options={categoryTabs} value={categoryTab} onChange={setCategoryTab} size="sm" /> : null}
            {categoryItems.length > 0 ? (
              <ShareBreakdown items={categoryItems} />
            ) : (
              <EmptyState variant="inline" icon="tag" title={t('analytics.noCategoryData')} description={t('analytics.noCategoryDataHint')} />
            )}
          </View>
        </View>

        {isPremium ? (
          <View>
            <SectionHeader title={t('premium.insightsTitle')} rightText={t('dashboard.thisMonth')} noPadding />
            <InsightsCarousel currency={currency} />
          </View>
        ) : null}

        {/* When: the weekly shape, then day by day. */}
        {isPremium ? (
          <View>
            <SectionHeader title={t('analytics.weeklyPattern')} rightText={t('analytics.averageByDay')} noPadding />
            {overview.weekdays.length === 0 ? (
              <EmptyState variant="inline" icon="calendar" title={t('analytics.noWeekly')} description={t('analytics.noWeeklyHint')} />
            ) : (
              <View style={styles.card}>
                <DowChart data={overview.weekdays} currency={currency} />
                {overview.weekdayInsight ? (
                  <Text variant="caption" tone="muted" align="center">
                    {overview.weekdayInsight}
                  </Text>
                ) : null}
              </View>
            )}
          </View>
        ) : null}

        <View>
          <SectionHeader title={t('dashboard.rhythmTitle')} rightText={t('dashboard.rhythmHint')} noPadding />
          <SpendingHeatmap currency={currency} />
        </View>

        {/* With whom and where it sits. */}
        {!isPremium ? (
          <ProPreviewCard features={['highlights', 'forecast', 'insights', 'categories', 'weekly', 'people']} />
        ) : (
          <>
            {personItems.length > 0 ? (
              <View>
                <SectionHeader title={t('analytics.personBreakdown')} rightText={t('analytics.personsCount', { count: personItems.length })} noPadding />
                <ShareBreakdown items={personItems} />
              </View>
            ) : null}

            <View>
              <SectionHeader title={t('analytics.balanceDistribution')} rightText={t('analytics.accountsCount', { count: accountItems.length })} noPadding />
              {accountItems.length > 0 ? (
                <ShareBreakdown items={accountItems} />
              ) : (
                <EmptyState
                  variant="inline"
                  icon="wallet-stack"
                  title={t('analytics.noCurrencyAccounts', { currency })}
                  description={t('analytics.noCurrencyAccountsHint')}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
});

const createStyles = ({ colors, spacing, radius, layout, tabBarClearance }: ThemeContextType, bottomInset: number) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: tabBarClearance(bottomInset),
      gap: spacing('6'),
    },
    emptyContent: { paddingTop: spacing('8') },
    emptyFeatures: { backgroundColor: colors.surface, borderRadius: radius('2xl'), padding: spacing('5'), gap: spacing('4') },
    emptyFeature: { flexDirection: 'row', alignItems: 'center', gap: spacing('3') },
    emptyFeatureText: { flex: 1, gap: 2 },
    stack: { gap: spacing('3') },
    skeletonRow: { flexDirection: 'row', gap: spacing('3') },
    flex: { flex: 1 },
    card: { backgroundColor: colors.surface, borderRadius: radius('xl'), padding: spacing('4'), gap: spacing('3') },
  });
