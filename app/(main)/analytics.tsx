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
import { BlurBackground } from '../../src/components/ui/BlurBackground';
import { Header } from '../../src/components/ui/Header';
import { IconAvatar } from '../../src/components/ui/IconAvatar';
import { MoneyText } from '../../src/components/ui/MoneyText';
import { PremiumGuard } from '../../src/components/ui/PremiumGuard';
import { DEFAULT_CURRENCY } from '../../src/constants/currency';
import { useAccounts } from '../../src/features/accounts/hooks/accounts';
import { AreaChart, type AreaChartPoint } from '../../src/features/analytics/components/AreaChart';
import { BarGroupChart, type BarBucket } from '../../src/features/analytics/components/BarGroupChart';
import { DonutChart } from '../../src/features/analytics/components/DonutChart';
import { DowChart } from '../../src/features/analytics/components/DowChart';
import {
  useAnalyticsCategoryBreakdown,
  useAnalyticsDailyData,
  useAnalyticsDow,
  useAnalyticsMonthlyData,
} from '../../src/features/analytics/hooks/useAnalyticsData';
import { usePremium } from '../../src/providers/PremiumProvider';
import { useTheme, ThemeContextType } from '../../src/providers/ThemeProvider';
import { colorNumberToHex } from '../../src/utils/format';
import { resolveIcon } from '../../src/utils/icons';

// ─── helpers ─────────────────────────────────────────────────────────────────

const RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '12M', days: 365 },
] as const;

type RangeDays = (typeof RANGES)[number]['days'];

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmtDayLabel = (iso: string, rangeDays: number): string => {
  const parts = iso.split('-'); // [YYYY, MM, DD]
  if (rangeDays <= 30) return `${parts[2]}/${SHORT_MONTHS[Number(parts[1]) - 1]}`;
  return SHORT_MONTHS[Number(parts[1]) - 1];
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

// ─── screen ──────────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 48;
  const router = useRouter();
  const { isPremium } = usePremium();

  // ── state ──────────────────────────────────────────────────────────────────
  const { data: accounts } = useAccounts();
  const currencyKeys = useMemo(() => {
    const keys = Array.from(new Set((accounts ?? []).map(a => a.currency)));
    return keys.length > 0 ? keys : [DEFAULT_CURRENCY];
  }, [accounts]);

  const [selectedCurrency, setSelectedCurrency] = React.useState<string>(currencyKeys[0]);
  const [selectedRange, setSelectedRange] = React.useState<RangeDays>(30);

  React.useEffect(() => {
    if (!currencyKeys.includes(selectedCurrency)) setSelectedCurrency(currencyKeys[0]);
  }, [currencyKeys, selectedCurrency]);

  // ── data ───────────────────────────────────────────────────────────────────
  const { data: dailyData, isLoading: dailyLoading } = useAnalyticsDailyData(selectedCurrency, selectedRange);
  const { data: monthlyData, isLoading: monthlyLoading } = useAnalyticsMonthlyData(selectedCurrency);
  const { data: categoryData, isLoading: catLoading } = useAnalyticsCategoryBreakdown(selectedCurrency, selectedRange);
  const { data: dowData } = useAnalyticsDow(selectedCurrency, selectedRange);

  const isLoading = dailyLoading || monthlyLoading || catLoading;

  // ── derived ────────────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const src = selectedRange === 365 ? monthlyData : dailyData;
    if (!src || src.length === 0) return { income: 0, expense: 0, net: 0, savingsRate: 0 };
    const income = src.reduce((s, d) => s + d.income, 0);
    const expense = src.reduce((s, d) => s + d.expense, 0);
    const net = income - expense;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;
    return { income, expense, net, savingsRate };
  }, [dailyData, monthlyData, selectedRange]);

  const areaData = useMemo((): AreaChartPoint[] => {
    if (selectedRange === 365) {
      return (monthlyData ?? []).map(m => ({
        label: fmtMonthLabel(m.month),
        income: m.income,
        expense: m.expense,
      }));
    }
    return (dailyData ?? []).map(d => ({
      label: fmtDayLabel(d.day, selectedRange),
      income: d.income,
      expense: d.expense,
    }));
  }, [dailyData, monthlyData, selectedRange]);

  const barData = useMemo((): BarBucket[] => {
    if (selectedRange === 7) {
      return (dailyData ?? []).map(d => ({
        label: fmtDayLabel(d.day, 7),
        income: d.income,
        expense: d.expense,
      }));
    }
    if (selectedRange === 30) {
      return chunkAggregate(dailyData ?? [], 5);
    }
    // 90D or 12M → monthly
    const monthly = monthlyData ?? [];
    const take = selectedRange === 90 ? 3 : 12;
    return monthly.slice(-take).map(m => ({
      label: fmtMonthLabel(m.month),
      income: m.income,
      expense: m.expense,
    }));
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
        hex: colorNumberToHex(a.color),
        share: totalBalance > 0 ? Math.max(a.balance, 0) / totalBalance : 0,
      }))
      .sort((a, b) => b.balance - a.balance);
  }, [currencyAccounts]);

  // ── behavioral metrics ─────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const balance = currencyAccounts.reduce((s, a) => s + a.balance, 0);
    const dailyBurn = summary.expense / selectedRange;
    const runway = dailyBurn > 0 ? balance / dailyBurn : null;
    const flowRatio = summary.expense > 0 ? summary.income / summary.expense : null;
    const txCount = (dailyData ?? []).reduce((s, d) => s + (d.expense > 0 ? 1 : 0), 0);
    return { dailyBurn, runway, flowRatio, txCount };
  }, [summary, currencyAccounts, selectedRange, dailyData]);

  // ── period comparison ──────────────────────────────────────────────────────
  const prevSummary = useMemo(() => {
    // previous window = same duration before current window
    // We only have daily data for current range; for comparison we'd need prevRange fetched
    // Approximation: use monthly data to compute prev if range=30/7
    return null; // placeholder — full impl requires second query
  }, []);

  const handleCurrencySelect = useCallback((c: string) => setSelectedCurrency(c), []);
  const handleRangeSelect = useCallback((d: RangeDays) => setSelectedRange(d), []);
  const navigateToPremium = useCallback(() => router.push('/premium'), [router]);

  // ─── render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />
      <Header title="Analytics" showBack />

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* ── Currency tabs ── */}
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

          {/* ── Range pills ── */}
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
                  {locked && <Ionicons name="lock-closed" size={9} color={colors.textMuted} style={{ marginLeft: 3 }} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Overview metrics ── */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricTile, { flex: 2 }]}>
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
              <Text style={[
                styles.metricPlain,
                { color: summary.savingsRate >= 0 ? colors.success : colors.danger, fontFamily: theme.typography.fonts.amountBold },
              ]}>
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

          {/* ── Spending trend ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SPENDING TREND</Text>
            <Text style={styles.sectionHint}>{RANGES.find(r => r.days === selectedRange)?.label} · {selectedCurrency}</Text>
          </View>
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

          {/* ── Period flow bar chart ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PERIOD FLOW</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>In</Text>
              <View style={[styles.legendDot, { backgroundColor: colors.danger, marginLeft: 8 }]} />
              <Text style={styles.legendText}>Out</Text>
            </View>
          </View>
          <View style={styles.card}>
            <BarGroupChart data={barData} width={chartWidth - 28} height={170} />
          </View>

          {/* ── Category breakdown ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CATEGORY BREAKDOWN</Text>
            <Text style={styles.sectionHint}>{(categoryData ?? []).length} groups</Text>
          </View>
          <View style={styles.card}>
            {(categoryData ?? []).length > 0 ? (
              <DonutChart data={categoryData ?? []} currency={selectedCurrency} size={168} />
            ) : (
              <EmptyState icon="pricetag-outline" text="No expense data in this period" />
            )}
          </View>

          {/* ── Account distribution ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ACCOUNT SPLIT</Text>
            <Text style={styles.sectionHint}>{accountDistribution.length} accounts</Text>
          </View>
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
                      <Text style={[styles.accountName, { color: colors.text }]} numberOfLines={1}>{acc.name}</Text>
                      <MoneyText amount={acc.balance} currency={acc.currency} weight="bold" style={styles.accountBal} />
                    </View>
                    <View style={[styles.accountBarTrack, { backgroundColor: colors.background }]}>
                      <View style={[styles.accountBarFill, { width: `${acc.share * 100}%`, backgroundColor: acc.hex }]} />
                    </View>
                    <Text style={[styles.accountShare, { color: colors.textMuted, fontFamily: theme.typography.fonts.regular }]}>
                      {Math.round(acc.share * 100)}% of total balance
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <EmptyState icon="wallet-outline" text={`No accounts in ${selectedCurrency}`} />
            )}
          </View>

          {/* ── Day of week ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SPENDING BY WEEKDAY</Text>
            <Text style={styles.sectionHint}>Average pattern</Text>
          </View>
          <View style={styles.card}>
            <DowChart data={dowData ?? []} />
            <View style={styles.dowLegend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>Low</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.warning }]} /><Text style={styles.legendText}>Mid</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.danger }]} /><Text style={styles.legendText}>High</Text></View>
            </View>
          </View>

          {/* ── Behavioral KPIs (Premium) ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>BEHAVIORAL INSIGHTS</Text>
          </View>
          <PremiumGuard label="Behavioral Insights" size="medium">
            <View style={styles.card}>
              <View style={styles.kpiGrid}>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>DAILY BURN</Text>
                  <MoneyText amount={metrics.dailyBurn} currency={selectedCurrency} type="DR" weight="bold" style={styles.kpiValue} />
                </View>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>RUNWAY</Text>
                  <Text style={[styles.kpiPlain, { color: colors.text, fontFamily: theme.typography.fonts.amountBold }]}>
                    {metrics.runway === null ? '∞' : `${Math.max(0, metrics.runway).toFixed(0)}d`}
                  </Text>
                </View>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>IN/OUT RATIO</Text>
                  <Text style={[styles.kpiPlain, { color: colors.text, fontFamily: theme.typography.fonts.amountBold }]}>
                    {metrics.flowRatio === null ? '—' : `${metrics.flowRatio.toFixed(2)}×`}
                  </Text>
                </View>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>ACTIVE DAYS</Text>
                  <Text style={[styles.kpiPlain, { color: colors.text, fontFamily: theme.typography.fonts.amountBold }]}>
                    {metrics.txCount}
                  </Text>
                </View>
              </View>
            </View>
          </PremiumGuard>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textMuted, fontFamily: theme.typography.fonts.semibold }]}>
              LUNO / ANALYTICS
            </Text>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function EmptyState({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const { colors, typography } = useTheme();
  return (
    <View style={{ paddingVertical: 32, alignItems: 'center', gap: 10 }}>
      <Ionicons name={icon} size={28} color={colors.textMuted} />
      <Text style={{ color: colors.textMuted, fontFamily: typography.fonts.regular, fontSize: 12, textAlign: 'center' }}>
        {text}
      </Text>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { paddingHorizontal: 24, paddingBottom: 60, paddingTop: 4 },

    pillRow: {
      flexDirection: 'row',
      gap: spacing('2'),
      marginBottom: spacing('3'),
      flexWrap: 'wrap',
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 32,
      paddingHorizontal: spacing('3'),
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    pillLocked: { opacity: 0.55 },
    pillText: { fontFamily: typography.fonts.semibold, color: colors.textMuted, fontSize: 11, letterSpacing: 0.5 },
    pillTextActive: { color: colors.background },

    metricsGrid: {
      flexDirection: 'row',
      gap: spacing('2'),
      marginBottom: spacing('2'),
    },
    metricTile: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('3.5'),
      minHeight: 76,
      justifyContent: 'space-between',
    },
    metricLabel: {
      fontFamily: typography.fonts.semibold,
      color: colors.textMuted,
      fontSize: 8.5,
      letterSpacing: 1.2,
      marginBottom: spacing('1.5'),
    },
    metricValue: { fontSize: 26, lineHeight: 30, letterSpacing: -0.8 },
    metricSmall: { fontSize: 16 },
    metricPlain: { fontSize: 24, letterSpacing: -0.5 },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing('5'),
      marginBottom: spacing('2.5'),
    },
    sectionTitle: {
      fontFamily: typography.fonts.semibold,
      color: colors.text,
      fontSize: 10,
      letterSpacing: 1.4,
    },
    sectionHint: {
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      fontSize: 11,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('3.5'),
      overflow: 'hidden',
    },

    chartLegend: {
      flexDirection: 'row',
      gap: spacing('4'),
      marginBottom: spacing('2'),
    },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 7, height: 7, borderRadius: 4 },
    legendDash: { width: 14, height: 2, borderRadius: 1 },
    legendText: {
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      fontSize: 10,
    },

    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2.5'),
      paddingVertical: spacing('2.5'),
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '50',
    },
    rowLast: { borderBottomWidth: 0 },
    accountInfo: { flex: 1, gap: spacing('1') },
    accountTopLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    accountName: { fontFamily: typography.fonts.semibold, fontSize: 13, flex: 1 },
    accountBal: { fontSize: 13 },
    accountBarTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
    accountBarFill: { height: 3, borderRadius: 2 },
    accountShare: { fontSize: 10 },

    dowLegend: {
      flexDirection: 'row',
      gap: spacing('3'),
      marginTop: spacing('2'),
      justifyContent: 'center',
    },

    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('2') },
    kpiCell: {
      width: '47%',
      minHeight: 72,
      borderRadius: radius('lg'),
      backgroundColor: colors.background + '80',
      padding: spacing('3'),
      justifyContent: 'space-between',
    },
    kpiLabel: {
      fontFamily: typography.fonts.semibold,
      color: colors.textMuted,
      fontSize: 8.5,
      letterSpacing: 1.1,
    },
    kpiValue: { fontSize: 14 },
    kpiPlain: { fontSize: 18, letterSpacing: -0.5 },

    footer: { alignItems: 'center', marginTop: spacing('8') },
    footerText: { fontSize: 9, letterSpacing: 3, opacity: 0.4 },
  });
