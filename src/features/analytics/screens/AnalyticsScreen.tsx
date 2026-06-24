import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { Header } from '@/src/components/ui/Header';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { PremiumGuard } from '@/src/components/ui/PremiumGuard';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { DEFAULT_CURRENCY } from '@/src/constants/currency';
import { StorageKeys } from '@/src/constants/keys';
import { AccountType } from '@/src/types';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { DowChart } from '@/src/features/analytics/components/DowChart';
import { LinearAreaChart, type BarBucket } from '@/src/features/analytics/components/LinearAreaChart';
import {
  useAnalyticsBiggestExpense,
  useAnalyticsCategoryBreakdown,
  useAnalyticsDailyData,
  useAnalyticsDow,
  useAnalyticsIncomeCategoryBreakdown,
  useAnalyticsMonthlyData,
  useAnalyticsPersonBreakdown,
  useAnalyticsPreviousPeriod,
} from '@/src/features/analytics/hooks/useAnalyticsData';
import { ANALYTICS_WALKTHROUGH_STEPS, WalkthroughOverlay } from '@/src/features/walkthrough';
import { usePremium } from '@/src/providers/PremiumProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveAccountTypeIcon, resolveIcon } from '@/src/utils/icons';
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Calendar01Icon,
  ChartLineData01Icon,
  LockPasswordIcon,
  SparklesIcon,
  Tag01Icon,
  Wallet05Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { format } from 'date-fns';
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
const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const fmtDayLabel = (iso: string, rangeDays: number): string => {
  const parts = iso.split('-');
  if (rangeDays <= 30) return `${parts[2]}/${SHORT_MONTHS[Number(parts[1]) - 1]}`;
  return SHORT_MONTHS[Number(parts[1]) - 1] ?? '';
};

const fmtMonthLabel = (ym: string): string => {
  const [, m] = ym.split('-');
  return SHORT_MONTHS[Number(m) - 1] ?? ym;
};

function EmptyState({ icon, title, subtitle }: { icon: IconSvgElement; title: string; subtitle: string }) {
  const theme = useTheme();
  const { colors, typography, spacing, radius, layout } = theme;
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      marginHorizontal: layout.screenPadding,
    }}>
      <View style={{
        width: 40, height: 40,
        borderRadius: radius('xl'),
        backgroundColor: colors.primary + '14',
        justifyContent: 'center', alignItems: 'center',
      }}>
        <HugeiconsIcon icon={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: typography.styles.rowLabel.fontFamily, fontSize: 13, color: colors.text }}>
          {title}
        </Text>
        <Text style={{ fontFamily: typography.fonts.regular, fontSize: 11, color: colors.textMuted, lineHeight: 15 }}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function DeltaBadge({ delta, positiveIsGood }: { delta: number | null; positiveIsGood: boolean }) {
  const { colors, typography, spacing, radius } = useTheme();
  if (delta === null) return null;
  const isPositive = delta >= 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  const color = isGood ? colors.success : colors.danger;
  const sign = isPositive ? '+' : '';
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 2,
      backgroundColor: color + '1A',
      borderRadius: radius('full'),
      paddingHorizontal: spacing('2'),
      paddingVertical: 3,
      alignSelf: 'flex-start',
    }}>
      <HugeiconsIcon icon={isPositive ? ArrowUp01Icon : ArrowDown01Icon} size={10} color={color} />
      <Text style={{ fontFamily: typography.styles.badge.fontFamily, fontSize: 10, color }}>
        {sign}{Math.abs(delta).toFixed(0)}%
      </Text>
    </View>
  );
}

export const AnalyticsScreen = React.memo(function AnalyticsScreen() {
  const theme = useTheme();
  const { colors, layout, spacing, typography, radius } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: screenWidth } = useWindowDimensions();

  const gridCellWidth = useMemo(
    () => (screenWidth - layout.screenPadding * 2 - spacing('2')) / 2,
    [screenWidth, layout, spacing],
  );
  const cardCellWidth = useMemo(
    () => (screenWidth - layout.screenPadding * 2 - spacing('4') * 2 - spacing('2')) / 2,
    [screenWidth, layout, spacing],
  );
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
  const [catTab, setCatTab] = React.useState<'expense' | 'income'>('expense');

  React.useEffect(() => {
    if (!currencyKeys.includes(selectedCurrency)) setSelectedCurrency(currencyKeys[0]);
  }, [currencyKeys, selectedCurrency]);

  const { data: dailyData, isLoading: dailyLoading } = useAnalyticsDailyData(selectedCurrency, selectedRange);
  const { data: monthlyData, isLoading: monthlyLoading } = useAnalyticsMonthlyData(selectedCurrency);
  const { data: categoryData, isLoading: catLoading } = useAnalyticsCategoryBreakdown(selectedCurrency, selectedRange);
  const { data: incomeCategoryData } = useAnalyticsIncomeCategoryBreakdown(selectedCurrency, selectedRange);
  const { data: dowData } = useAnalyticsDow(selectedCurrency, selectedRange);
  const { data: personBreakdown } = useAnalyticsPersonBreakdown(selectedCurrency, selectedRange);
  const { data: prevPeriod } = useAnalyticsPreviousPeriod(selectedCurrency, selectedRange);
  const { data: biggestExpense } = useAnalyticsBiggestExpense(selectedCurrency, selectedRange);

  const isLoading = dailyLoading || monthlyLoading || catLoading;

  const summary = useMemo(() => {
    const src = selectedRange === 365 ? monthlyData : dailyData;
    if (!src || src.length === 0) return { income: 0, expense: 0, net: 0 };
    const income = src.reduce((s, d) => s + d.income, 0);
    const expense = src.reduce((s, d) => s + d.expense, 0);
    return { income, expense, net: income - expense };
  }, [dailyData, monthlyData, selectedRange]);

  const deltas = useMemo(() => {
    if (!prevPeriod) return { income: null, expense: null };
    return {
      income: prevPeriod.income > 0 ? ((summary.income - prevPeriod.income) / prevPeriod.income) * 100 : null,
      expense: prevPeriod.expense > 0 ? ((summary.expense - prevPeriod.expense) / prevPeriod.expense) * 100 : null,
    };
  }, [prevPeriod, summary]);

  const dailyAvg = useMemo(() => summary.expense / selectedRange, [summary.expense, selectedRange]);

  const forecast = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();
    return dailyAvg * daysLeft;
  }, [dailyAvg]);

  const areaData = useMemo((): BarBucket[] => {
    if (selectedRange === 365) {
      return (monthlyData ?? []).map(m => ({ label: fmtMonthLabel(m.month), income: m.income, expense: m.expense }));
    }
    return (dailyData ?? []).map(d => ({ label: fmtDayLabel(d.day, selectedRange), income: d.income, expense: d.expense }));
  }, [dailyData, monthlyData, selectedRange]);

  const rangeSubtitle = useMemo(() => {
    const now = new Date();
    if (selectedRange === 365) {
      const start = new Date();
      start.setDate(1);
      start.setMonth(start.getMonth() - 11);
      return `${format(start, 'MMM yyyy')} – ${format(now, 'MMM yyyy')}`;
    }
    const start = new Date();
    start.setDate(start.getDate() - selectedRange + 1);
    return `${format(start, 'd MMM yyyy')} – ${format(now, 'd MMM yyyy')}`;
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

  const dowInsight = useMemo(() => {
    if (!dowData || dowData.length < 2) return null;
    const withData = dowData.filter(d => d.total > 0);
    if (withData.length < 2) return null;
    const peak = withData.reduce((a, b) => a.total > b.total ? a : b);
    const lowest = withData.reduce((a, b) => a.total < b.total ? a : b);
    if (peak.dow === lowest.dow) return null;
    return `Spend most on ${DOW_NAMES[peak.dow]}, least on ${DOW_NAMES[lowest.dow]}.`;
  }, [dowData]);

  const activeCategoryData = catTab === 'expense' ? (categoryData ?? []) : (incomeCategoryData ?? []);
  const topCategory = (categoryData ?? [])[0] ?? null;

  const handleCurrencySelect = useCallback((c: string) => setSelectedCurrency(c), []);
  const handleRangeSelect = useCallback((d: RangeDays) => setSelectedRange(d), []);
  const navigateToPremium = useCallback(() => router.push('/premium'), [router]);
  const navigateToCategoryTransactions = useCallback(
    (categoryId: number) => router.push(`/transactions?categoryId=${categoryId}`),
    [router],
  );

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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollPillRow}>
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
                  {locked && <HugeiconsIcon icon={LockPasswordIcon} size={9} color={colors.textMuted} />}
                </BentoPressable>
              );
            })}
          </View>

          <Text style={styles.durationText}>{rangeSubtitle}</Text>

          {/* ── Summary: 4 equal tiles ── */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricTile, { backgroundColor: colors.success + '12' }]}>
              <View style={styles.metricTopRow}>
                <Text style={[styles.metricLabel, { color: colors.success }]}>Income</Text>
                <DeltaBadge delta={deltas.income} positiveIsGood={true} />
              </View>
              <MoneyText amount={summary.income} currency={selectedCurrency} type="CR" weight="bold" compact style={styles.metricSmall} />
            </View>
            <View style={[styles.metricTile, { backgroundColor: colors.danger + '12' }]}>
              <View style={styles.metricTopRow}>
                <Text style={[styles.metricLabel, { color: colors.danger }]}>Expenses</Text>
                <DeltaBadge delta={deltas.expense} positiveIsGood={false} />
              </View>
              <MoneyText amount={summary.expense} currency={selectedCurrency} type="DR" weight="bold" compact style={styles.metricSmall} />
            </View>
          </View>
          <View style={[styles.metricsGrid, styles.metricsGridLast]}>
            <View style={styles.metricTile}>
              <Text style={styles.metricLabel}>Net position</Text>
              <MoneyText
                amount={Math.abs(summary.net)}
                currency={selectedCurrency}
                type={summary.net >= 0 ? 'CR' : 'DR'}
                weight="bold"
                compact
                style={styles.metricSmall}
              />
            </View>
            <View style={styles.metricTile}>
              <Text style={styles.metricLabel}>Daily avg spend</Text>
              <MoneyText amount={dailyAvg} currency={selectedCurrency} type="DR" weight="bold" compact style={styles.metricSmall} />
            </View>
          </View>

          {/* ── Highlights ── */}
          <SectionHeader title="Highlights" />
          <PremiumGuard label="Highlights" size="medium" containerStyle={styles.guard}>
            {(topCategory || biggestExpense) ? (
              <View style={styles.highlightGroup}>
                {topCategory && (
                  <BentoPressable
                    style={[styles.highlightCard, styles.highlightCardFirst, !biggestExpense && styles.highlightCardLast]}
                    onPress={() => navigateToCategoryTransactions(topCategory.id)}
                  >
                    <IconAvatar
                      icon={resolveIcon(topCategory.icon, Tag01Icon)}
                      color={colorNumberToHex(topCategory.color)}
                      variant="subtle"
                      size={40}
                      iconSize={18}
                    />
                    <View style={styles.highlightContent}>
                      <Text style={styles.highlightMeta}>Top expense category</Text>
                      <Text style={styles.highlightName} numberOfLines={1}>{topCategory.name}</Text>
                    </View>
                    <MoneyText amount={topCategory.amount} currency={selectedCurrency} type="DR" weight="bold" compact style={styles.highlightAmount} />
                  </BentoPressable>
                )}

                {biggestExpense && (
                  <BentoPressable
                    style={[styles.highlightCard, styles.highlightCardLast, !topCategory && styles.highlightCardFirst]}
                    onPress={() => navigateToCategoryTransactions(biggestExpense.categoryId)}
                  >
                    <IconAvatar
                      icon={resolveIcon(biggestExpense.categoryIcon, SparklesIcon)}
                      color={colorNumberToHex(biggestExpense.categoryColor)}
                      variant="subtle"
                      size={40}
                      iconSize={18}
                    />
                    <View style={styles.highlightContent}>
                      <Text style={styles.highlightMeta}>Biggest expense</Text>
                      <Text style={styles.highlightName} numberOfLines={1}>
                        {biggestExpense.note || biggestExpense.category}
                      </Text>
                    </View>
                    <MoneyText amount={biggestExpense.amount} currency={selectedCurrency} type="DR" weight="bold" compact style={styles.highlightAmount} />
                  </BentoPressable>
                )}
              </View>
            ) : (
              <EmptyState
                icon={SparklesIcon}
                title="No highlights yet"
                subtitle="Add expense transactions to surface key spending insights."
              />
            )}
          </PremiumGuard>

          {/* ── Spending trend ── */}
          <SectionHeader
            title="Spending trend"
            rightText={`${RANGES.find(r => r.days === selectedRange)?.label} · ${selectedCurrency}`}
          />
          {areaData.length === 0 ? (
            <EmptyState
              icon={ChartLineData01Icon}
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

          {/* ── Category breakdown (with expense/income tabs) ── */}
          <SectionHeader title="Category breakdown" rightText={`${activeCategoryData.length} groups`} />
          <PremiumGuard label="Category Breakdown" size="medium" containerStyle={styles.guard}>
            {/* Tab toggle */}
            <View style={styles.tabRow}>
              <BentoPressable
                style={[styles.tab, catTab === 'expense' && styles.tabActive]}
                onPress={() => setCatTab('expense')}
              >
                <Text style={[styles.tabText, catTab === 'expense' && styles.tabTextActive]}>Expenses</Text>
              </BentoPressable>
              <BentoPressable
                style={[styles.tab, catTab === 'income' && styles.tabActive]}
                onPress={() => setCatTab('income')}
              >
                <Text style={[styles.tabText, catTab === 'income' && styles.tabTextActive]}>Income</Text>
              </BentoPressable>
            </View>

            {activeCategoryData.length > 0 ? (
              <View style={styles.catSection}>
                <View style={styles.stackedBar}>
                  {activeCategoryData.map((cat, idx) => (
                    <View
                      key={`seg-${idx}`}
                      style={[styles.stackedSeg, { flex: cat.amount, backgroundColor: colorNumberToHex(cat.color) }]}
                    />
                  ))}
                </View>
                <View style={styles.categoryGrid}>
                  {activeCategoryData.map((cat, idx) => {
                    const accent = colorNumberToHex(cat.color);
                    const total = activeCategoryData.reduce((s, c) => s + c.amount, 0);
                    const pct = total > 0 ? (cat.amount / total) * 100 : 0;
                    return (
                      <BentoPressable
                        key={`${cat.name}-${idx}`}
                        style={[styles.categoryCell, { width: gridCellWidth }]}
                        onPress={() => navigateToCategoryTransactions(cat.id)}
                      >
                        <IconAvatar icon={resolveIcon(cat.icon, Tag01Icon)} color={accent} variant="subtle" size={28} iconSize={13} />
                        <View style={styles.catContent}>
                          <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                          <MoneyText
                            amount={cat.amount}
                            currency={selectedCurrency}
                            type={catTab === 'expense' ? 'DR' : 'CR'}
                            compact
                            style={styles.catAmount}
                          />
                        </View>
                        <Text style={[styles.catPercent, { color: colors.textMuted }]}>{pct.toFixed(0)}%</Text>
                      </BentoPressable>
                    );
                  })}
                </View>
              </View>
            ) : (
              <EmptyState
                icon={Tag01Icon}
                title={`No ${catTab === 'expense' ? 'expense' : 'income'} categories yet`}
                subtitle={`Add ${catTab === 'expense' ? 'expense' : 'income'} transactions to see a category breakdown.`}
              />
            )}
          </PremiumGuard>

          {/* ── Person breakdown ── */}
          {(personBreakdown ?? []).length > 0 && (
            <>
              <SectionHeader title="Person breakdown" rightText={`${(personBreakdown ?? []).length} persons`} />
              <PremiumGuard label="Person Breakdown" size="medium" containerStyle={styles.guard}>
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
                        <View key={`pp-${p.id}-${idx}`} style={[styles.categoryCell, { width: gridCellWidth }]}>
                          <View style={[styles.personAvatar, { backgroundColor: hex + '18' }]}>
                            <Text style={[styles.personInitials, { color: hex }]}>{initials}</Text>
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

          {/* ── Balance distribution ── */}
          <SectionHeader title="Balance distribution" rightText={`${accountDistribution.length} accounts`} />
          <PremiumGuard label="Balance Distribution" size="medium" containerStyle={styles.guard}>
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
                    <View key={`${acc.id}-${idx}`} style={[styles.categoryCell, { width: gridCellWidth }]}>
                      <IconAvatar
                        icon={resolveAccountTypeIcon(acc.accountType as AccountType | null)}
                        color={acc.hex}
                        variant="subtle"
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
                icon={Wallet05Icon}
                title={`No ${selectedCurrency} accounts`}
                subtitle="Add an account in this currency to see the balance distribution."
              />
            )}
          </PremiumGuard>

          {/* ── Weekly pattern ── */}
          <SectionHeader title="Weekly pattern" rightText="Average by day" />
          <PremiumGuard label="Weekly Pattern" size="medium" containerStyle={styles.guard}>
            {(dowData ?? []).length === 0 ? (
              <EmptyState
                icon={Calendar01Icon}
                title="No weekly pattern yet"
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
                {dowInsight && (
                  <Text style={styles.dowInsight}>{dowInsight}</Text>
                )}
              </View>
            )}
          </PremiumGuard>

          {/* ── Spending patterns ── */}
          <SectionHeader title="Spending patterns" />
          <PremiumGuard label="Spending Patterns" size="medium" containerStyle={styles.guard}>
            <View style={styles.card}>
              <View style={styles.kpiGrid}>
                <View style={[styles.kpiCell, { width: cardCellWidth }]}>
                  <Text style={styles.kpiLabel}>Daily avg spend</Text>
                  <MoneyText amount={dailyAvg} currency={selectedCurrency} type="DR" weight="bold" style={styles.kpiValue} />
                </View>
                <View style={[styles.kpiCell, { width: cardCellWidth }]}>
                  <Text style={styles.kpiLabel}>Month-end forecast</Text>
                  <MoneyText amount={forecast} currency={selectedCurrency} type="DR" weight="bold" style={styles.kpiValue} />
                </View>
              </View>
            </View>
          </PremiumGuard>

        </ScrollView>
      )}
      <WalkthroughOverlay storageKey={StorageKeys.WALKTHROUGH_ANALYTICS} steps={ANALYTICS_WALKTHROUGH_STEPS} />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { paddingBottom: 110, paddingTop: spacing('3') },
    guard: { marginHorizontal: layout.screenPadding },

    // ── Pill selectors
    pillRow: {
      flexDirection: 'row',
      gap: spacing('2'),
      marginBottom: spacing('3'),
      flexWrap: 'wrap',
      paddingHorizontal: layout.screenPadding,
    },
    scrollPillRow: {
      flexDirection: 'row',
      gap: spacing('2'),
      marginBottom: spacing('3'),
      paddingHorizontal: layout.screenPadding,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
      height: 32,
      paddingHorizontal: spacing('3'),
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
    },
    pillActive: { backgroundColor: colors.primary + '18' },
    pillLocked: { opacity: 0.55 },
    pillText: { fontFamily: typography.styles.chipLabel.fontFamily, color: colors.textMuted, fontSize: typography.sizes.xs },
    pillTextActive: { color: colors.primary },
    durationText: {
      fontFamily: typography.fonts.medium,
      fontSize: 12,
      color: colors.textMuted,
      paddingHorizontal: layout.screenPadding,
      marginBottom: spacing('5'),
    },

    // ── Metric tiles
    metricsGrid: {
      flexDirection: 'row',
      gap: spacing('2'),
      marginBottom: spacing('2'),
      paddingHorizontal: layout.screenPadding,
    },
    metricsGridLast: { marginBottom: spacing('1') },
    metricTile: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      gap: spacing('2'),
    },
    metricTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    metricLabel: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
      letterSpacing: 0.3,
    },
    metricSmall: { fontSize: typography.sizes.xl },

    // ── Card
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      padding: spacing('4'),
      marginHorizontal: layout.screenPadding,
    },

    // ── Highlights
    highlightGroup: {
      gap: 2,
      marginHorizontal: layout.screenPadding,
    },
    highlightCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      backgroundColor: colors.surface,
      padding: spacing('3.5'),
    },
    highlightCardFirst: {
      borderTopLeftRadius: radius('xl'),
      borderTopRightRadius: radius('xl'),
    },
    highlightCardLast: {
      borderBottomLeftRadius: radius('xl'),
      borderBottomRightRadius: radius('xl'),
    },
    highlightContent: { flex: 1, gap: 3 },
    highlightMeta: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xxs,
      color: colors.textMuted,
      letterSpacing: 0.2,
    },
    highlightName: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
    highlightAmount: { fontSize: typography.sizes.sm },

    // ── Chart legend
    chartLegend: { flexDirection: 'row', gap: spacing('4'), marginBottom: spacing('2') },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing('1.5') },
    legendDot: { width: 7, height: 7, borderRadius: radius('full') },
    legendText: { fontFamily: typography.fonts.regular, color: colors.textMuted, fontSize: 10 },

    // ── Category tabs
    tabRow: {
      flexDirection: 'row',
      gap: spacing('2'),
      marginHorizontal: layout.screenPadding,
      marginBottom: spacing('3'),
    },
    tab: {
      flex: 1,
      height: 32,
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabActive: { backgroundColor: colors.primary + '18' },
    tabText: {
      fontFamily: typography.styles.chipLabel.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    tabTextActive: { color: colors.primary },

    // ── Category / person breakdown
    catSection: { gap: spacing('3') },
    stackedBar: {
      flexDirection: 'row',
      height: 10,
      borderRadius: radius('full'),
      overflow: 'hidden',
      gap: 2,
      marginHorizontal: layout.screenPadding,
    },
    stackedSeg: { borderRadius: radius('full') },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('2'),
      paddingHorizontal: layout.screenPadding,
    },
    categoryCell: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('3'),
      gap: spacing('2'),
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
    },
    catContent: { flex: 1, flexDirection: 'column' },
    catName: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.text,
    },
    catAmount: { fontSize: typography.sizes.xs },
    catPercent: {
      fontFamily: typography.styles.badge.fontFamily,
      fontSize: typography.sizes.xxs,
      position: 'absolute',
      right: spacing('3'),
      top: spacing('3'),
    },

    // ── Person avatar
    personAvatar: {
      width: 28, height: 28,
      borderRadius: radius('xl'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    personInitials: {
      fontFamily: typography.styles.profileMono.fontFamily,
      fontSize: 10,
    },

    // ── DOW
    dowLegend: { flexDirection: 'row', gap: spacing('3'), marginTop: spacing('2'), justifyContent: 'center' },
    dowInsight: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing('2'),
      lineHeight: 17,
    },

    // ── KPI grid
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('2') },
    kpiCell: {
      minHeight: 84,
      borderRadius: radius('xl'),
      backgroundColor: colors.card,
      padding: spacing('3.5'),
      justifyContent: 'space-between',
    },
    kpiLabel: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
      letterSpacing: 0.3,
    },
    kpiValue: { fontSize: typography.sizes.lg },
  });
