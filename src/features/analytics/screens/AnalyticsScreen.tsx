import { Header } from '@/src/components/ui/Header';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { format } from 'date-fns';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { PremiumGuard } from '@/src/components/ui/PremiumGuard';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { DEFAULT_CURRENCY } from '@/src/constants/currency';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { LinearAreaChart, type BarBucket } from '@/src/features/analytics/components/LinearAreaChart';
import { DowChart } from '@/src/features/analytics/components/DowChart';
import {
  useAnalyticsCategoryBreakdown,
  useAnalyticsDailyData,
  useAnalyticsDow,
  useAnalyticsMonthlyData,
  useAnalyticsPersonBreakdown,
} from '@/src/features/analytics/hooks/useAnalyticsData';
import { usePremium } from '@/src/providers/PremiumProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';
import { WalkthroughOverlay, ANALYTICS_WALKTHROUGH_STEPS } from '@/src/features/walkthrough';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '12M', days: 365 },
] as const;

type RangeDays = (typeof RANGES)[number]['days'];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtDayLabel = (iso: string, rangeDays: number): string => {
  const parts = iso.split('-');
  if (rangeDays <= 30) return `${parts[2]}/${SHORT_MONTHS[Number(parts[1]) - 1]}`;
  return SHORT_MONTHS[Number(parts[1]) - 1] ?? '';
};

const fmtMonthLabel = (ym: string): string => {
  const [, m] = ym.split('-');
  return SHORT_MONTHS[Number(m) - 1] ?? ym;
};

const chunkAggregate = (
  daily: { day: string; income: number; expense: number }[],
  chunks: number,
): BarBucket[] => {
  if (daily.length === 0) return [];
  const size = Math.ceil(daily.length / chunks);
  const result: BarBucket[] = [];
  for (let i = 0; i < daily.length; i += size) {
    const slice = daily.slice(i, i + size);
    result.push({
      label: fmtDayLabel(slice[0].day, 30),
      income: slice.reduce((s, d) => s + d.income, 0),
      expense: slice.reduce((s, d) => s + d.expense, 0),
    });
  }
  return result;
};

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
}) {
  const theme = useTheme();
  const styles = useMemo(
    () => {
      const { colors, typography, spacing, radius } = theme;
      return StyleSheet.create({
        row: {
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          gap: spacing('3'),
          backgroundColor: colors.surface,
          borderRadius: radius('xl'),
          padding: spacing('4'),
          marginHorizontal: 16,
        },
        iconRing: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.primary + '14',
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
        },
        texts: { flex: 1, gap: 2 },
        titleText: {
          fontFamily: typography.fonts.semibold,
          fontSize: 13,
          color: colors.text,
        },
        subText: {
          fontFamily: typography.fonts.regular,
          fontSize: 11,
          color: colors.textMuted,
          lineHeight: 15,
        },
      });
    },
    [theme],
  );
  return (
    <View style={styles.row}>
      <View style={styles.iconRing}>
        <MaterialCommunityIcons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.titleText}>{title}</Text>
        <Text style={styles.subText}>{subtitle}</Text>
      </View>
    </View>
  );
}

export const AnalyticsScreen = React.memo(function AnalyticsScreen() {
  const theme = useTheme();
  const { colors, layout, spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - layout.screenPadding * 2 - spacing('3.5') * 2;
  const router = useRouter();
  const { isPremium } = usePremium();

  const { data: accounts } = useAccounts();
  const currencyKeys = useMemo(() => {
    const keys = Array.from(new Set((accounts ?? []).map(a => a.currency)));
    return keys.length > 0 ? keys : [DEFAULT_CURRENCY];
  }, [accounts]);

  const [selectedCurrency, setSelectedCurrency] = React.useState<string>(currencyKeys[0]);
  const [selectedRange, setSelectedRange] = React.useState<RangeDays>(7);

  React.useEffect(() => {
    if (!currencyKeys.includes(selectedCurrency)) setSelectedCurrency(currencyKeys[0]);
  }, [currencyKeys, selectedCurrency]);

  const { data: dailyData, isLoading: dailyLoading } = useAnalyticsDailyData(selectedCurrency, selectedRange);
  const { data: monthlyData, isLoading: monthlyLoading } = useAnalyticsMonthlyData(selectedCurrency);
  const { data: categoryData, isLoading: catLoading } = useAnalyticsCategoryBreakdown(selectedCurrency, selectedRange);
  const { data: dowData } = useAnalyticsDow(selectedCurrency, selectedRange);
  const { data: personBreakdown } = useAnalyticsPersonBreakdown(selectedCurrency, selectedRange);

  const isLoading = dailyLoading || monthlyLoading || catLoading;

  const summary = useMemo(() => {
    const src = selectedRange === 365 ? monthlyData : dailyData;
    if (!src || src.length === 0) return { income: 0, expense: 0, net: 0, savingsRate: 0 };
    const income = src.reduce((s, d) => s + d.income, 0);
    const expense = src.reduce((s, d) => s + d.expense, 0);
    const net = income - expense;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;
    return { income, expense, net, savingsRate };
  }, [dailyData, monthlyData, selectedRange]);

  const areaData = useMemo((): BarBucket[] => {
    if (selectedRange === 365) {
      return (monthlyData ?? []).map(m => ({ label: fmtMonthLabel(m.month), income: m.income, expense: m.expense }));
    }
    return (dailyData ?? []).map(d => ({ label: fmtDayLabel(d.day, selectedRange), income: d.income, expense: d.expense }));
  }, [dailyData, monthlyData, selectedRange]);

  const barData = useMemo((): BarBucket[] => {
    if (selectedRange === 7) {
      return (dailyData ?? []).map(d => ({ label: fmtDayLabel(d.day, 7), income: d.income, expense: d.expense }));
    }
    if (selectedRange === 30) return chunkAggregate(dailyData ?? [], 5);
    const monthly = monthlyData ?? [];
    const take = selectedRange === 90 ? 3 : 12;
    return monthly.slice(-take).map(m => ({ label: fmtMonthLabel(m.month), income: m.income, expense: m.expense }));
  }, [dailyData, monthlyData, selectedRange]);

  const rangeSubtitle = useMemo(() => {
    const now = new Date();
    if (selectedRange === 365) {
      const start = new Date();
      start.setDate(1);
      start.setMonth(start.getMonth() - 11);
      return `${format(start, 'MMM yyyy')} – ${format(now, 'MMM yyyy')}`;
    } else {
      const start = new Date();
      start.setDate(start.getDate() - selectedRange + 1);
      return `${format(start, 'd MMM yyyy')} – ${format(now, 'd MMM yyyy')}`;
    }
  }, [selectedRange]);

  const currencyAccounts = useMemo(
    () => (accounts ?? []).filter(a => a.currency === selectedCurrency),
    [accounts, selectedCurrency],
  );

  const accountDistribution = useMemo(() => {
    const totalBalance = currencyAccounts.reduce((s, a) => s + Math.max(a.balance, 0), 0);
    return currencyAccounts
      .map(a => ({
        ...a,
        hex: colorNumberToHex(a.color),
        share: totalBalance > 0 ? Math.max(a.balance, 0) / totalBalance : 0,
      }))
      .sort((a, b) => b.balance - a.balance);
  }, [currencyAccounts]);

  const metrics = useMemo(() => {
    const balance = currencyAccounts.reduce((s, a) => s + a.balance, 0);
    const dailyBurn = summary.expense / selectedRange;
    const runway = dailyBurn > 0 ? balance / dailyBurn : null;
    const flowRatio = summary.expense > 0 ? summary.income / summary.expense : null;
    const txCount = (dailyData ?? []).reduce((s, d) => s + (d.expense > 0 ? 1 : 0), 0);
    return { dailyBurn, runway, flowRatio, txCount };
  }, [summary, currencyAccounts, selectedRange, dailyData]);

  const handleCurrencySelect = useCallback((c: string) => setSelectedCurrency(c), []);
  const handleRangeSelect = useCallback((d: RangeDays) => setSelectedRange(d), []);
  const navigateToPremium = useCallback(() => router.push('/premium'), [router]);

  const savingsColor = summary.savingsRate >= 0 ? colors.success : colors.danger;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageBackground />
      <Header title="Analytics" />

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Currency picker */}
          {currencyKeys.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              {currencyKeys.map(c => (
                <BentoPressable
                  key={c}
                  style={[styles.pill, c === selectedCurrency && styles.pillActive]}
                  onPress={() => handleCurrencySelect(c)}
                >
                  <Text style={[styles.pillText, c === selectedCurrency && styles.pillTextActive]}>{c}</Text>
                </BentoPressable>
              ))}
            </ScrollView>
          )}

          {/* Range picker */}
          <View style={styles.pillRow}>
            {RANGES.map(r => {
              const locked = !isPremium && r.days !== 7;
              return (
                <BentoPressable
                  key={r.label}
                  style={[styles.pill, r.days === selectedRange && styles.pillActive, locked && styles.pillLocked]}
                  onPress={locked ? navigateToPremium : () => handleRangeSelect(r.days)}
                >
                  <Text style={[styles.pillText, r.days === selectedRange && styles.pillTextActive]}>{r.label}</Text>
                  {locked && <MaterialCommunityIcons name="lock" size={9} color={colors.textMuted} style={styles.lockIcon} />}
                </BentoPressable>
              );
            })}
          </View>

          <Text style={styles.durationText}>{rangeSubtitle}</Text>

          {/* Summary metrics 2×2 */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricTile, styles.metricTileWide]}>
              <Text style={styles.metricLabel}>Net position</Text>
              <MoneyText
                amount={Math.abs(summary.net)}
                currency={selectedCurrency}
                type={summary.net >= 0 ? 'CR' : 'DR'}
                weight="bold"
                compact
                style={styles.metricValue}
              />
            </View>
            <View style={styles.metricTile}>
              <Text style={styles.metricLabel}>Savings</Text>
              <Text style={[styles.metricPlain, { color: savingsColor }]}>
                {summary.savingsRate >= 0 ? '+' : ''}{summary.savingsRate.toFixed(0)}%
              </Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={[styles.metricTile, { backgroundColor: colors.success + '15' }]}>
              <Text style={[styles.metricLabel, { color: colors.success }]}>Income</Text>
              <MoneyText amount={summary.income} currency={selectedCurrency} type="CR" weight="bold" compact style={styles.metricSmall} />
            </View>
            <View style={[styles.metricTile, { backgroundColor: colors.danger + '15' }]}>
              <Text style={[styles.metricLabel, { color: colors.danger }]}>Expenses</Text>
              <MoneyText amount={summary.expense} currency={selectedCurrency} type="DR" weight="bold" compact style={styles.metricSmall} />
            </View>
          </View>

          {/* Spending trend */}
          <SectionHeader
            title="Spending trend"
            rightText={`${RANGES.find(r => r.days === selectedRange)?.label} · ${selectedCurrency}`}
          />
          {areaData.length === 0 ? (
            <EmptyState
              icon="chart-line"
              title="No trend data yet"
              subtitle="Add income or expense transactions to see your spending trend."
            />
          ) : (
            <View style={styles.card}>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                  <Text style={styles.legendText}>Expense</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.legendText}>Income</Text>
                </View>
              </View>
              <LinearAreaChart data={areaData} width={chartWidth} height={190} />
            </View>
          )}

          {/* Period flow */}
          <SectionHeader title="Period flow" />
          <PremiumGuard label="Period Flow" size="medium">
            {barData.length === 0 ? (
              <EmptyState
                icon="chart-line"
                title="No period data yet"
                subtitle="Record transactions to visualise income vs expense by period."
              />
            ) : (
              <View style={styles.card}>
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                    <Text style={styles.legendText}>Expense</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                    <Text style={styles.legendText}>Income</Text>
                  </View>
                </View>
                <LinearAreaChart data={barData} width={chartWidth} height={170} />
              </View>
            )}
          </PremiumGuard>

          {/* Category breakdown — stacked bar + 2-column cards */}
          <SectionHeader title="Category breakdown" rightText={`${(categoryData ?? []).length} groups`} />
          <PremiumGuard label="Category Breakdown" size="medium">
            {(categoryData ?? []).length > 0 ? (
              <View style={styles.catSection}>
                {/* Single stacked bar */}
                <View style={styles.stackedBar}>
                  {(categoryData ?? []).map((cat, idx) => (
                    <View
                      key={`seg-${idx}`}
                      style={[styles.stackedSeg, { flex: cat.amount, backgroundColor: colorNumberToHex(cat.color) }]}
                    />
                  ))}
                </View>

                {/* 2-column category cards */}
                <View style={styles.categoryGrid}>
                  {(categoryData ?? []).map((cat, idx) => {
                    const accent = colorNumberToHex(cat.color);
                    const total = (categoryData ?? []).reduce((s, c) => s + c.amount, 0);
                    const pct = total > 0 ? (cat.amount / total) * 100 : 0;
                    return (
                      <View key={`${cat.name}-${idx}`} style={styles.categoryCell}>

                        <IconAvatar
                          icon={resolveIcon(cat.icon, 'tag-outline')}
                          color={accent}
                          variant="solid"
                          size={28}
                          iconSize={13}
                        />
                        <View style={styles.catContent}>
                          <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                          <MoneyText amount={cat.amount} currency={selectedCurrency} type="DR" compact style={styles.catAmount} />

                        </View>
                        <Text style={[styles.catPercent, { color: colors.textMuted }]}>{pct.toFixed(0)}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : (
              <EmptyState
                icon="tag-outline"
                title="No category data yet"
                subtitle="Add expense transactions to see a breakdown by category."
              />
            )}
          </PremiumGuard>

          {/* Person breakdown */}
          {(personBreakdown ?? []).length > 0 && (
            <>
              <SectionHeader title="Person breakdown" rightText={`${(personBreakdown ?? []).length} persons`} />
              <PremiumGuard label="Person Breakdown" size="medium">
                <View style={styles.catSection}>
                  <View style={styles.stackedBar}>
                    {(personBreakdown ?? []).map((p, idx) => (
                      <View
                        key={`ps-${idx}`}
                        style={[styles.stackedSeg, { flex: p.amount, backgroundColor: colorNumberToHex(p.color) }]}
                      />
                    ))}
                  </View>
                  <View style={styles.categoryGrid}>
                    {(personBreakdown ?? []).map((p, idx) => {
                      const hex = colorNumberToHex(p.color);
                      const total = (personBreakdown ?? []).reduce((s, x) => s + x.amount, 0);
                      const pct = total > 0 ? (p.amount / total) * 100 : 0;
                      const initials = p.name.trim().split(' ').map((w: string) => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
                      return (
                        <View key={`pp-${p.id}-${idx}`} style={styles.categoryCell}>
                          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: hex, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 10 }}>{initials}</Text>
                          </View>
                          <View style={styles.catContent}>
                            <Text style={styles.catName} numberOfLines={1}>{p.name}</Text>
                            <MoneyText amount={p.amount} currency={selectedCurrency} type="DR" compact style={styles.catAmount} />
                          </View>
                          <Text style={[styles.catPercent, { color: colors.textMuted }]}>{pct.toFixed(0)}%</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </PremiumGuard>
            </>
          )}

          {/* Account split */}
          <SectionHeader title="Account split" rightText={`${accountDistribution.length} accounts`} />
          <PremiumGuard label="Account Split" size="medium">
            {accountDistribution.length > 0 ? (
              <View style={styles.catSection}>
                <View style={styles.stackedBar}>
                  {accountDistribution.map((acc, idx) => (
                    <View
                      key={`acc-seg-${idx}`}
                      style={[styles.stackedSeg, { flex: acc.share, backgroundColor: acc.hex }]}
                    />
                  ))}
                </View>
                <View style={styles.categoryGrid}>
                  {accountDistribution.map((acc, idx) => (
                    <View key={`${acc.id}-${idx}`} style={styles.categoryCell}>
                      <IconAvatar
                        icon={resolveIcon(acc.icon, 'wallet-outline')}
                        color={acc.hex}
                        variant="solid"
                        size={28}
                        iconSize={13}
                      />
                      <View style={styles.catContent}>
                        <Text style={styles.catName} numberOfLines={1}>{acc.name}</Text>
                        <MoneyText amount={acc.balance} currency={acc.currency} weight="bold" compact style={styles.catAmount} />
                      </View>
                      <Text style={[styles.catPercent, { color: colors.textMuted }]}>{Math.round(acc.share * 100)}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <EmptyState
                icon="wallet-outline"
                title={`No ${selectedCurrency} accounts`}
                subtitle="Add an account in this currency to see the balance split."
              />
            )}
          </PremiumGuard>

          {/* Spending by weekday */}
          <SectionHeader title="Spending by weekday" rightText="Average pattern" />
          <PremiumGuard label="Spending by Weekday" size="medium">
            {(dowData ?? []).length === 0 ? (
              <EmptyState
                icon="calendar-week"
                title="No weekday pattern yet"
                subtitle="More transactions will reveal your spending rhythm by day."
              />
            ) : (
              <View style={styles.card}>
                <DowChart data={dowData ?? []} />
                <View style={styles.dowLegend}>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>Low</Text></View>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.warning }]} /><Text style={styles.legendText}>Mid</Text></View>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.danger }]} /><Text style={styles.legendText}>High</Text></View>
                </View>
              </View>
            )}
          </PremiumGuard>

          {/* Behavioral insights */}
          <SectionHeader title="Behavioral insights" />
          <PremiumGuard label="Behavioral Insights" size="medium">
            <View style={styles.card}>
              <View style={styles.kpiGrid}>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>Daily burn</Text>
                  <MoneyText amount={metrics.dailyBurn} currency={selectedCurrency} type="DR" weight="bold" style={styles.kpiValue} />
                </View>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>Runway</Text>
                  <Text style={styles.kpiPlain}>
                    {metrics.runway === null ? '∞' : `${Math.max(0, metrics.runway).toFixed(0)}d`}
                  </Text>
                </View>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>In/out ratio</Text>
                  <Text style={styles.kpiPlain}>
                    {metrics.flowRatio === null ? '—' : `${metrics.flowRatio.toFixed(2)}×`}
                  </Text>
                </View>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>Active days</Text>
                  <Text style={styles.kpiPlain}>{metrics.txCount}</Text>
                </View>
              </View>
            </View>
          </PremiumGuard>

        </ScrollView>
      )}
      <WalkthroughOverlay storageKey="@luno_walkthrough_analytics" steps={ANALYTICS_WALKTHROUGH_STEPS} />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { paddingBottom: 24, paddingTop: spacing('2') },

    // ── Pill selectors
    pillRow: {
      flexDirection: 'row',
      gap: spacing('2'),
      marginBottom: spacing('3'),
      flexWrap: 'wrap',
      paddingHorizontal: layout.screenPadding,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 32,
      paddingHorizontal: spacing('3'),
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
    },
    pillActive: { backgroundColor: colors.primary + '18' },
    pillLocked: { opacity: 0.55 },
    pillText: { fontFamily: typography.fonts.semibold, color: colors.textMuted, fontSize: 11 },
    pillTextActive: { color: colors.primary },
    lockIcon: { marginLeft: spacing('1') },
    durationText: {
      fontFamily: typography.fonts.medium,
      fontSize: 12,
      color: colors.textMuted,
      paddingHorizontal: layout.screenPadding,
      marginBottom: spacing('3'),
    },

    // ── Metric tiles
    metricsGrid: {
      flexDirection: 'row',
      gap: spacing('2'),
      marginBottom: spacing('2'),
      paddingHorizontal: layout.screenPadding,
    },
    metricTile: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('3.5'),
      gap: spacing('1.5'),
    },
    metricTileWide: { flex: 2 },
    metricLabel: {
      fontFamily: typography.fonts.semibold,
      color: colors.textMuted,
      fontSize: 11,
    },
    metricValue: { fontSize: 22, lineHeight: 26, letterSpacing: -0.5 },
    metricSmall: { fontSize: 15 },
    metricPlain: {
      fontFamily: typography.fonts.amountBold,
      fontSize: 22,
      letterSpacing: -0.5,
    },

    // ── Card
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('3.5'),
      overflow: 'hidden',
      marginHorizontal: layout.screenPadding,
    },

    // ── Chart legend
    chartLegend: { flexDirection: 'row', gap: spacing('4'), marginBottom: spacing('2') },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing('1.5') },
    legendDot: { width: 7, height: 7, borderRadius: radius('full') },
    legendDash: { width: 14, height: 2, borderRadius: radius('full') },
    legendText: { fontFamily: typography.fonts.regular, color: colors.textMuted, fontSize: 10 },

    // ── Category breakdown section
    catSection: {
      gap: spacing('3'),
    },
    stackedBar: {
      flexDirection: 'row',
      height: 8,
      borderRadius: radius('full'),
      overflow: 'hidden',
      gap: 2,
      marginHorizontal: layout.screenPadding,
    },
    stackedSeg: {
      borderRadius: radius('full'),
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('1'),
      paddingHorizontal: layout.screenPadding,
    },
    categoryCell: {
      width: '49.2%',
      backgroundColor: colors.surface,
      borderRadius: radius('lg'),
      padding: spacing('3'),
      gap: spacing('2'),
      position: 'relative',
      flexDirection: 'row',
    },
    catName: {
      flex: 1,
      fontFamily: typography.fonts.semibold,
      fontSize: 11,
      color: colors.text,
    },
    catBarTrack: {
      height: 3,
      borderRadius: radius('full'),
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    catBarFill: {
      height: 3,
      borderRadius: radius('full'),
    },
    catContent: {
      flexDirection: 'column'
    },
    catAmount: { fontSize: 11 },
    catPercent: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      position: 'absolute',
      right: spacing('3'),
      top: spacing('3'),
    },

    // ── DOW legend
    dowLegend: { flexDirection: 'row', gap: spacing('3'), marginTop: spacing('2'), justifyContent: 'center' },

    // ── KPI grid
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('2') },
    kpiCell: {
      width: '47%',
      minHeight: 72,
      borderRadius: radius('lg'),
      backgroundColor: colors.card,
      padding: spacing('3'),
      justifyContent: 'space-between',
    },
    kpiLabel: {
      fontFamily: typography.fonts.semibold,
      color: colors.textMuted,
      fontSize: 11,
    },
    kpiValue: { fontSize: 14 },
    kpiPlain: {
      fontFamily: typography.fonts.amountBold,
      color: colors.text,
      fontSize: 18,
      letterSpacing: -0.5,
    },
  });

