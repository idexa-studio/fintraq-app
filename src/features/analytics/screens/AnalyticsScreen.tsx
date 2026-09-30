import { Calendar01Icon, ChartLineData01Icon, Tag01Icon, Wallet05Icon } from '@hugeicons/core-free-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, IconAvatar, PersonAvatar, Screen, SectionHeader, SegmentedControl, SkeletonScreen, StatTile, Text } from '@/src/components/ui';
import { DEFAULT_CURRENCY, sortCurrenciesWithDefault } from '@/src/constants/currency';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { AnalyticsControls } from '@/src/features/analytics/components/AnalyticsControls';
import { AnalyticsHighlights } from '@/src/features/analytics/components/AnalyticsHighlights';
import { ChartLegend } from '@/src/features/analytics/components/ChartLegend';
import { DowChart } from '@/src/features/analytics/components/DowChart';
import { LinearAreaChart } from '@/src/features/analytics/components/LinearAreaChart';
import { ShareBreakdown, ShareItem } from '@/src/features/analytics/components/ShareBreakdown';
import { ANALYTICS_RANGES, FREE_RANGE_DAYS, RangeDays } from '@/src/features/analytics/constants';
import { useAnalyticsOverview } from '@/src/features/analytics/hooks/useAnalyticsOverview';
import { PremiumGuard } from '@/src/features/premium/components/PremiumGuard';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useSettings } from '@/src/providers/SettingsProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { AccountType } from '@/src/types';
import { withShares } from '@/src/utils/analytics';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveAccountTypeIcon, resolveIcon } from '@/src/utils/icons';

type CategoryTab = 'expense' | 'income';

export const AnalyticsScreen = React.memo(function AnalyticsScreen() {
  const theme = useTheme();
  const { colors, layout, spacing } = theme;
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);
  const router = useRouter();
  const { isPremium } = usePremium();
  const { profile } = useSettings();
  const { data: accounts = [] } = useAccounts();

  const currencies = useMemo(() => {
    const unique = Array.from(new Set(accounts.map((a) => a.currency)));
    return sortCurrenciesWithDefault(unique.length > 0 ? unique : [DEFAULT_CURRENCY], profile.defaultCurrency);
  }, [accounts, profile.defaultCurrency]);

  const [chosenCurrency, setCurrency] = useState<string | null>(null);
  // Falls back when the choice disappears (e.g. its last account was deleted).
  const currency = chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0];
  const [range, setRange] = useState<RangeDays>(FREE_RANGE_DAYS);
  const [categoryTab, setCategoryTab] = useState<CategoryTab>('expense');

  const overview = useAnalyticsOverview(currency, range);

  const openPremium = useCallback(() => router.push('/premium'), [router]);
  const openCategory = useCallback((categoryId: number) => router.push(`/transactions?categoryId=${categoryId}`), [router]);

  const categoryItems = useMemo((): ShareItem[] => {
    const type = categoryTab === 'expense' ? 'DR' : 'CR';
    const source = categoryTab === 'expense' ? overview.expenseCategories : overview.incomeCategories;
    return withShares(source).map((c) => {
      const color = colorNumberToHex(c.color);
      return {
        key: String(c.id),
        name: c.name,
        amount: c.amount,
        currency,
        share: c.share,
        color,
        type,
        leading: <IconAvatar icon={resolveIcon(c.icon, Tag01Icon)} color={color} size={28} iconSize={13} />,
        onPress: () => openCategory(c.id),
      };
    });
  }, [categoryTab, overview.expenseCategories, overview.incomeCategories, currency, openCategory]);

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
        };
      }),
    [overview.people, currency],
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
          };
        }),
    [accounts, currency],
  );

  const categoryTabs = useMemo(
    () => [
      { value: 'expense' as const, label: t('analytics.expenses') },
      { value: 'income' as const, label: t('analytics.income') },
    ],
    [t],
  );

  const rangeLabel = ANALYTICS_RANGES.find((r) => r.days === range)?.label;
  const chartWidth = windowWidth - layout.screenPadding * 2 - spacing('4') * 2;

  if (overview.isLoading) {
    return (
      <Screen header={{ title: t('common.analyticsTitle') }} variant="fixed" edges={['top']}>
        <SkeletonScreen />
      </Screen>
    );
  }

  return (
    <Screen header={{ title: t('common.analyticsTitle') }} variant="fixed" edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AnalyticsControls
          currencies={currencies}
          currency={currency}
          onCurrencyChange={setCurrency}
          range={range}
          onRangeChange={setRange}
          isPremium={isPremium}
          onLockedRange={openPremium}
        />

        <View style={styles.tiles}>
          <View style={styles.tileRow}>
            <StatTile label={t('analytics.income')} amount={overview.totals.income} currency={currency} type="CR" delta={overview.deltas.income} compact style={styles.tile} />
            <StatTile
              label={t('analytics.expenses')}
              amount={overview.totals.expense}
              currency={currency}
              type="DR"
              delta={overview.deltas.expense}
              positiveIsGood={false}
              compact
              style={styles.tile}
            />
          </View>
          <View style={styles.tileRow}>
            <StatTile
              label={t('analytics.netPosition')}
              amount={Math.abs(overview.totals.net)}
              currency={currency}
              type={overview.totals.net >= 0 ? 'CR' : 'DR'}
              compact
              style={styles.tile}
            />
            <StatTile label={t('analytics.dailyAvg')} amount={overview.dailyAverage} currency={currency} type="DR" compact style={styles.tile} />
          </View>
        </View>

        <SectionHeader title={t('analytics.highlights')} noPadding />
        <PremiumGuard label={t('analytics.highlights')} size="medium">
          <AnalyticsHighlights
            topCategory={overview.topCategory}
            biggestExpense={overview.biggestExpense}
            currency={currency}
            onOpenCategory={openCategory}
          />
        </PremiumGuard>

        <SectionHeader title={t('analytics.trend')} rightText={`${rangeLabel} · ${currency}`} noPadding />
        {overview.chart.length === 0 ? (
          <EmptyState variant="inline" icon={ChartLineData01Icon} title={t('analytics.noTrend')} description={t('analytics.noTrendHint')} />
        ) : (
          <View style={[styles.card, styles.stack]}>
            <ChartLegend
              items={[
                { label: t('analytics.expense'), color: colors.danger },
                { label: t('analytics.income'), color: colors.success },
              ]}
            />
            <LinearAreaChart data={overview.chart} width={chartWidth} height={190} />
          </View>
        )}

        <SectionHeader title={t('analytics.categoryBreakdown')} rightText={t('analytics.groupsCount', { count: categoryItems.length })} noPadding />
        <PremiumGuard label={t('analytics.categoryBreakdown')} size="medium">
          <View style={styles.stack}>
            <SegmentedControl options={categoryTabs} value={categoryTab} onChange={setCategoryTab} size="sm" />
            {categoryItems.length > 0 ? (
              <ShareBreakdown items={categoryItems} />
            ) : (
              <EmptyState variant="inline" icon={Tag01Icon} title={t('analytics.noCategoryData')} description={t('analytics.noCategoryDataHint')} />
            )}
          </View>
        </PremiumGuard>

        {personItems.length > 0 && (
          <>
            <SectionHeader title={t('analytics.personBreakdown')} rightText={t('analytics.personsCount', { count: personItems.length })} noPadding />
            <PremiumGuard label={t('analytics.personBreakdown')} size="medium">
              <ShareBreakdown items={personItems} />
            </PremiumGuard>
          </>
        )}

        <SectionHeader title={t('analytics.balanceDistribution')} rightText={t('analytics.accountsCount', { count: accountItems.length })} noPadding />
        <PremiumGuard label={t('analytics.balanceDistribution')} size="medium">
          {accountItems.length > 0 ? (
            <ShareBreakdown items={accountItems} />
          ) : (
            <EmptyState
              variant="inline"
              icon={Wallet05Icon}
              title={t('analytics.noCurrencyAccounts', { currency })}
              description={t('analytics.noCurrencyAccountsHint')}
            />
          )}
        </PremiumGuard>

        <SectionHeader title={t('analytics.weeklyPattern')} rightText={t('analytics.averageByDay')} noPadding />
        <PremiumGuard label={t('analytics.weeklyPattern')} size="medium">
          {overview.weekdays.length === 0 ? (
            <EmptyState variant="inline" icon={Calendar01Icon} title={t('analytics.noWeekly')} description={t('analytics.noWeeklyHint')} />
          ) : (
            <View style={[styles.card, styles.stack]}>
              <DowChart data={overview.weekdays} />
              <ChartLegend
                align="center"
                items={[
                  { label: t('analytics.low'), color: colors.success },
                  { label: t('analytics.mid'), color: colors.warning },
                  { label: t('analytics.high'), color: colors.danger },
                ]}
              />
              {overview.weekdayInsight && (
                <Text variant="caption" tone="muted" align="center">
                  {overview.weekdayInsight}
                </Text>
              )}
            </View>
          )}
        </PremiumGuard>

        <SectionHeader title={t('analytics.spendingPatterns')} noPadding />
        <PremiumGuard label={t('analytics.spendingPatterns')} size="medium">
          <View style={styles.tileRow}>
            <StatTile label={t('analytics.dailyAvg')} amount={overview.dailyAverage} currency={currency} type="DR" style={styles.tile} />
            <StatTile label={t('analytics.monthEndForecast')} amount={overview.forecast} currency={currency} type="DR" style={styles.tile} />
          </View>
        </PremiumGuard>
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
    },
    tiles: { gap: spacing('2'), marginTop: spacing('5') },
    tileRow: { flexDirection: 'row', gap: spacing('2') },
    tile: { flex: 1 },
    stack: { gap: spacing('3') },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
    },
  });
