import { PageBackground } from '@/src/components/ui/PageBackground';
import { Header } from '@/src/components/ui/Header';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { PremiumGuard } from '@/src/components/ui/PremiumGuard';
import { DEFAULT_CURRENCY } from '@/src/constants/currency';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { AreaChart, type AreaChartPoint } from '@/src/features/analytics/components/AreaChart';
import { BarGroupChart, type BarBucket } from '@/src/features/analytics/components/BarGroupChart';
import { DonutChart } from '@/src/features/analytics/components/DonutChart';
import { DowChart } from '@/src/features/analytics/components/DowChart';
import {
  useAnalyticsCategoryBreakdown,
  useAnalyticsDailyData,
  useAnalyticsDow,
  useAnalyticsMonthlyData,
} from '@/src/features/analytics/hooks/useAnalyticsData';
import { usePremium } from '@/src/providers/PremiumProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RANGES = [
  { label: '7D',  days: 7   },
  { label: '30D', days: 30  },
  { label: '90D', days: 90  },
  { label: '12M', days: 365 },
] as const;

type RangeDays = (typeof RANGES)[number]['days'];

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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

function EmptyState({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const theme = useTheme();
  const { colors, typography, spacing } = theme;
  const styles = useMemo(() => StyleSheet.create({
    wrap: { paddingVertical: spacing('8'), alignItems: 'center' as const, gap: spacing('2.5') },
    text: { fontFamily: typography.fonts.regular, color: colors.textMuted, fontSize: 12, textAlign: 'center' as const },
  }), [theme]);
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={28} color={colors.textMuted} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

export const AnalyticsScreen = React.memo(function AnalyticsScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 48;
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

  const { data: dailyData,   isLoading: dailyLoading   } = useAnalyticsDailyData(selectedCurrency, selectedRange);
  const { data: monthlyData, isLoading: monthlyLoading } = useAnalyticsMonthlyData(selectedCurrency);
  const { data: categoryData, isLoading: catLoading    } = useAnalyticsCategoryBreakdown(selectedCurrency, selectedRange);
  const { data: dowData } = useAnalyticsDow(selectedCurrency, selectedRange);

  const isLoading = dailyLoading || monthlyLoading || catLoading;

  const summary = useMemo(() => {
    const src = selectedRange === 365 ? monthlyData : dailyData;
    if (!src || src.length === 0) return { income: 0, expense: 0, net: 0, savingsRate: 0 };
    const income  = src.reduce((s, d) => s + d.income,  0);
    const expense = src.reduce((s, d) => s + d.expense, 0);
    const net = income - expense;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;
    return { income, expense, net, savingsRate };
  }, [dailyData, monthlyData, selectedRange]);

  const areaData = useMemo((): AreaChartPoint[] => {
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

  const currencyAccounts = useMemo(
    () => (accounts ?? []).filter(a => a.currency === selectedCurrency),
    [accounts, selectedCurrency],
  );

  const accountDistribution = useMemo(() => {
    const totalBalance = currencyAccounts.reduce((s, a) => s + Math.max(a.balance, 0), 0);
    return currencyAccounts
      .map(a => ({
        ...a,
        hex:   colorNumberToHex(a.color),
        share: totalBalance > 0 ? Math.max(a.balance, 0) / totalBalance : 0,
      }))
      .sort((a, b) => b.balance - a.balance);
  }, [currencyAccounts]);

  const metrics = useMemo(() => {
    const balance  = currencyAccounts.reduce((s, a) => s + a.balance, 0);
    const dailyBurn = summary.expense / selectedRange;
    const runway    = dailyBurn > 0 ? balance / dailyBurn : null;
    const flowRatio = summary.expense > 0 ? summary.income / summary.expense : null;
    const txCount   = (dailyData ?? []).reduce((s, d) => s + (d.expense > 0 ? 1 : 0), 0);
    return { dailyBurn, runway, flowRatio, txCount };
  }, [summary, currencyAccounts, selectedRange, dailyData]);

  const handleCurrencySelect = useCallback((c: string) => setSelectedCurrency(c), []);
  const handleRangeSelect    = useCallback((d: RangeDays) => setSelectedRange(d), []);
  const navigateToPremium    = useCallback(() => router.push('/premium'), [router]);

  const savingsColor = summary.savingsRate >= 0 ? colors.success : colors.danger;

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />
      <Header title="Analytics" showBack />

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
                <TouchableOpacity
                  key={c}
                  style={[styles.pill, c === selectedCurrency && styles.pillActive]}
                  onPress={() => handleCurrencySelect(c)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, c === selectedCurrency && styles.pillTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Range picker */}
          <View style={styles.pillRow}>
            {RANGES.map(r => {
              const locked = !isPremium && r.days !== 7;
              return (
                <TouchableOpacity
                  key={r.label}
                  style={[styles.pill, r.days === selectedRange && styles.pillActive, locked && styles.pillLocked]}
                  onPress={locked ? navigateToPremium : () => handleRangeSelect(r.days)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, r.days === selectedRange && styles.pillTextActive]}>{r.label}</Text>
                  {locked && <Ionicons name="lock-closed" size={9} color={colors.textMuted} style={styles.lockIcon} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Summary metrics */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricTile, styles.metricTileWide]}>
              <Text style={styles.metricLabel}>NET POSITION</Text>
              <MoneyText
                amount={Math.abs(summary.net)}
                currency={selectedCurrency}
                type={summary.net >= 0 ? 'CR' : 'DR'}
                weight="bold"
                style={styles.metricValue}
              />
            </View>
            <View style={styles.metricTile}>
              <Text style={styles.metricLabel}>SAVINGS</Text>
              <Text style={[styles.metricPlain, { color: savingsColor }]}>
                {summary.savingsRate >= 0 ? '+' : ''}{summary.savingsRate.toFixed(0)}%
              </Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricTile}>
              <Text style={styles.metricLabel}>INCOME</Text>
              <MoneyText amount={summary.income} currency={selectedCurrency} type="CR" weight="bold" style={styles.metricSmall} />
            </View>
            <View style={styles.metricTile}>
              <Text style={styles.metricLabel}>EXPENSE</Text>
              <MoneyText amount={summary.expense} currency={selectedCurrency} type="DR" weight="bold" style={styles.metricSmall} />
            </View>
          </View>

          {/* Spending trend */}
          <SectionHeader
            title="Spending trend"
            rightText={`${RANGES.find(r => r.days === selectedRange)?.label} · ${selectedCurrency}`}
          />
          <View style={styles.card}>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                <Text style={styles.legendText}>Expense</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDash, { backgroundColor: colors.success }]} />
                <Text style={styles.legendText}>Income</Text>
              </View>
            </View>
            <AreaChart data={areaData} width={chartWidth - 28} height={190} />
          </View>

          {/* Period flow */}
          <SectionHeader title="Period flow" />
          <PremiumGuard label="Period Flow" size="medium">
            <View style={styles.card}>
              <BarGroupChart data={barData} width={chartWidth - 28} height={170} />
            </View>
          </PremiumGuard>

          {/* Category breakdown */}
          <SectionHeader title="Category breakdown" rightText={`${(categoryData ?? []).length} groups`} />
          <PremiumGuard label="Category Breakdown" size="medium">
            <View style={styles.card}>
              {(categoryData ?? []).length > 0 ? (
                <DonutChart data={categoryData ?? []} currency={selectedCurrency} size={168} />
              ) : (
                <EmptyState icon="pricetag-outline" text="No expense data in this period" />
              )}
            </View>
          </PremiumGuard>

          {/* Account split */}
          <SectionHeader title="Account split" rightText={`${accountDistribution.length} accounts`} />
          <PremiumGuard label="Account Split" size="medium">
            <View style={styles.card}>
              {accountDistribution.length > 0 ? (
                accountDistribution.map((acc, i) => (
                  <View key={acc.id} style={[styles.accountRow, i === accountDistribution.length - 1 && styles.rowLast]}>
                    <IconAvatar
                      icon={resolveIcon(acc.icon, 'wallet-outline')}
                      bg={acc.hex + '18'}
                      color={acc.hex}
                      size={34}
                      iconSize={16}
                    />
                    <View style={styles.accountInfo}>
                      <View style={styles.accountTopLine}>
                        <Text style={styles.accountName} numberOfLines={1}>{acc.name}</Text>
                        <MoneyText amount={acc.balance} currency={acc.currency} weight="bold" style={styles.accountBal} />
                      </View>
                      <View style={[styles.accountBarTrack, { backgroundColor: colors.background }]}>
                        <View style={[styles.accountBarFill, { width: `${acc.share * 100}%`, backgroundColor: acc.hex }]} />
                      </View>
                      <Text style={styles.accountShare}>{Math.round(acc.share * 100)}% of total balance</Text>
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState icon="wallet-outline" text={`No accounts in ${selectedCurrency}`} />
              )}
            </View>
          </PremiumGuard>

          {/* Spending by weekday */}
          <SectionHeader title="Spending by weekday" rightText="Average pattern" />
          <PremiumGuard label="Spending by Weekday" size="medium">
            <View style={styles.card}>
              <DowChart data={dowData ?? []} />
              <View style={styles.dowLegend}>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>Low</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.warning }]} /><Text style={styles.legendText}>Mid</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.danger  }]} /><Text style={styles.legendText}>High</Text></View>
              </View>
            </View>
          </PremiumGuard>

          {/* Behavioral insights */}
          <SectionHeader title="Behavioral insights" />
          <PremiumGuard label="Behavioral Insights" size="medium">
            <View style={styles.card}>
              <View style={styles.kpiGrid}>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>DAILY BURN</Text>
                  <MoneyText amount={metrics.dailyBurn} currency={selectedCurrency} type="DR" weight="bold" style={styles.kpiValue} />
                </View>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>RUNWAY</Text>
                  <Text style={styles.kpiPlain}>
                    {metrics.runway === null ? '∞' : `${Math.max(0, metrics.runway).toFixed(0)}d`}
                  </Text>
                </View>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>IN/OUT RATIO</Text>
                  <Text style={styles.kpiPlain}>
                    {metrics.flowRatio === null ? '—' : `${metrics.flowRatio.toFixed(2)}×`}
                  </Text>
                </View>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>ACTIVE DAYS</Text>
                  <Text style={styles.kpiPlain}>{metrics.txCount}</Text>
                </View>
              </View>
            </View>
          </PremiumGuard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>LUNO / ANALYTICS</Text>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
    loading:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content:   { paddingBottom: spacing('10'), paddingTop: spacing('2') },

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
    pillActive:  { backgroundColor: colors.text },
    pillLocked:  { opacity: 0.55 },
    pillText:        { fontFamily: typography.fonts.semibold, color: colors.textMuted, fontSize: 11, letterSpacing: 0.5 },
    pillTextActive:  { color: colors.background },
    lockIcon:        { marginLeft: spacing('1') },

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
      minHeight: 76,
      justifyContent: 'space-between',
    },
    metricTileWide: { flex: 2 },
    metricLabel: {
      fontFamily: typography.fonts.semibold,
      color: colors.textMuted,
      fontSize: 10,
      letterSpacing: 1.2,
      marginBottom: spacing('1.5'),
    },
    metricValue: { fontSize: 26, lineHeight: 30, letterSpacing: -0.8 },
    metricSmall: { fontSize: 16 },
    metricPlain: {
      fontFamily: typography.fonts.amountBold,
      fontSize: 24,
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
    legendItem:  { flexDirection: 'row', alignItems: 'center', gap: spacing('1.5') },
    legendDot:   { width: 7, height: 7, borderRadius: radius('full') },
    legendDash:  { width: 14, height: 2, borderRadius: radius('full') },
    legendText:  { fontFamily: typography.fonts.regular, color: colors.textMuted, fontSize: 10 },

    // ── Account rows
    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2.5'),
      paddingVertical: spacing('2.5'),
      borderBottomWidth: 1,
      borderBottomColor: colors.text + '08',
    },
    rowLast:       { borderBottomWidth: 0 },
    accountInfo:   { flex: 1, gap: spacing('1') },
    accountTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    accountName:   { fontFamily: typography.fonts.semibold, color: colors.text, fontSize: 13, flex: 1 },
    accountBal:    { fontSize: 13 },
    accountBarTrack: { height: 3, borderRadius: radius('full'), overflow: 'hidden' },
    accountBarFill:  { height: 3, borderRadius: radius('full') },
    accountShare:  { fontFamily: typography.fonts.regular, color: colors.textMuted, fontSize: 10 },

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
      fontSize: 10,
      letterSpacing: 1.1,
    },
    kpiValue: { fontSize: 14 },
    kpiPlain: {
      fontFamily: typography.fonts.amountBold,
      color: colors.text,
      fontSize: 18,
      letterSpacing: -0.5,
    },

    // ── Footer
    footer:     { alignItems: 'center', marginTop: spacing('8'), paddingHorizontal: layout.screenPadding },
    footerText: { fontFamily: typography.fonts.semibold, color: colors.textMuted, fontSize: 9, letterSpacing: 3, opacity: 0.4 },
  });
