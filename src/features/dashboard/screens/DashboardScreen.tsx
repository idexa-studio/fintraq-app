import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { MoneyText } from '../../../components/ui/MoneyText';
import { OptionsDialog } from '../../../components/ui/OptionsDialog';
import { TransactionRow } from '../../../components/ui/TransactionRow';
import { DEFAULT_CURRENCY } from '../../../constants/currency';
import { useSettings } from '../../../providers/SettingsProvider';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';
import { colorNumberToHex } from '../../../utils/format';
import type { Account } from '../../accounts/api/accounts';
import { useAccounts, useDeleteAccount } from '../../accounts/hooks/accounts';
import { useTransactions } from '../../transactions/hooks/transactions';
import { usePremium } from '@/src/providers/PremiumProvider';
import { BlurBackground } from '../../../components/ui/BlurBackground';
import { IconAvatar } from '../../../components/ui/IconAvatar';
import { TopExpenseCategoriesCard } from '../components/TopExpenseCategoriesCard';
import { useDashboardStats, useTopExpenseCategories } from '../hooks/dashboard';
import { InsightsSection } from '../components/InsightsSection';
import { StreakBadge } from '../../reports/components/StreakBadge';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const todayLabel = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

type IoniconName = keyof typeof Ionicons.glyphMap;

const resolveIconName = (raw: string | null | undefined, fallback: IoniconName): IoniconName => {
  if (raw && raw in Ionicons.glyphMap) return raw as IoniconName;
  if (raw) {
    const outlined = `${raw}-outline`;
    if (outlined in Ionicons.glyphMap) return outlined as IoniconName;
  }
  return fallback;
};

export const DashboardScreen = React.memo(function DashboardScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const { isPremium } = usePremium();
  useSettings();
  const { width: screenWidth } = useWindowDimensions();
  const styles = React.useMemo(() => createStyles(theme, screenWidth), [theme, screenWidth]);
  const router = useRouter();

  const { data: transactions, isLoading: txLoading } = useTransactions(6);
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { mutateAsync: deleteAccount } = useDeleteAccount();

  const [showAccountOptionsDialog, setShowAccountOptionsDialog] = React.useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = React.useState(false);
  const [activeAccount, setActiveAccount] = React.useState<Account | undefined>(undefined);

  const balancesByCurrency = React.useMemo(() => {
    return accounts?.reduce((acc, account) => {
      acc[account.currency] = (acc[account.currency] || 0) + account.balance;
      return acc;
    }, {} as Record<string, number>) || {};
  }, [accounts]);

  const currencyKeys = React.useMemo(() => {
    const keys = Object.keys(balancesByCurrency);
    return keys.length > 0 ? keys : [DEFAULT_CURRENCY];
  }, [balancesByCurrency]);

  const [selectedCurrency, setSelectedCurrency] = React.useState<string>(currencyKeys[0]);

  React.useEffect(() => {
    if (!currencyKeys.includes(selectedCurrency)) {
      setSelectedCurrency(currencyKeys[0]);
    }
  }, [currencyKeys, selectedCurrency]);

  const { data: statsQueryData } = useDashboardStats(selectedCurrency);
  const totals = React.useMemo(() => statsQueryData ?? { income: 0, expense: 0 }, [statsQueryData]);

  const { data: topCategoriesData } = useTopExpenseCategories(selectedCurrency);
  const topExpenseCategories = React.useMemo(() => topCategoriesData ?? [], [topCategoriesData]);

  const topCategoryCurrencies = currencyKeys;
  const [selectedTopCategoryCurrency, setSelectedTopCategoryCurrency] = React.useState<string>(selectedCurrency);

  React.useEffect(() => {
    setSelectedTopCategoryCurrency(selectedCurrency);
  }, [selectedCurrency]);

  const handleAccountLongPress = useCallback((acc: Account) => {
    setActiveAccount(acc);
    setShowAccountOptionsDialog(true);
  }, []);

  const handleCurrencySelect = useCallback((curr: string) => {
    setSelectedCurrency(curr);
  }, []);

  const navigateToSearch = useCallback(() => {
    router.push('/search');
  }, [router]);

  const navigateToAnalytics = useCallback(() => {
    router.push('/(main)/analytics');
  }, [router]);

  const navigateToSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const navigateToPremium = useCallback(() => {
    router.push('/premium');
  }, [router]);

  const navigateToTransactions = useCallback(() => {
    router.push('/transactions');
  }, [router]);

  const navigateToCreateTransaction = useCallback(() => {
    router.push('/transactions/create');
  }, [router]);

  const navigateToAccountTransactions = useCallback((accountId: number) => {
    router.push(`/transactions?accountId=${accountId}`);
  }, [router]);

  const navigateToEditTransaction = useCallback((txId: number) => {
    router.push(`/transactions/edit/${txId}`);
  }, [router]);

  const openAccountForm = useCallback(() => {
    router.push('/(main)/accounts/form');
  }, [router]);

  const closeOptionsDialog = useCallback(() => {
    setShowAccountOptionsDialog(false);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setShowDeleteAccountDialog(false);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!activeAccount) return;
    deleteAccount(activeAccount.id);
    setActiveAccount(undefined);
  }, [activeAccount, deleteAccount]);

  const accountOptions = React.useMemo(() => {
    if (!activeAccount) return [];
    return [
      {
        key: 'edit-account',
        label: 'Edit account',
        icon: 'create-outline' as const,
        onPress: () => {
          router.push(`/(main)/accounts/form?id=${activeAccount.id}`);
        },
      },
      {
        key: 'delete-account',
        label: 'Delete account',
        icon: 'trash-outline' as const,
        destructive: true,
        onPress: () => setShowDeleteAccountDialog(true),
      },
    ];
  }, [activeAccount, router]);

  const todayStr = React.useMemo(() => todayLabel(), []);

  if (txLoading || accountsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const incomeBarRatio = totals.income + totals.expense > 0
    ? totals.income / (totals.income + totals.expense)
    : 0.5;

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerGreeting}>{getGreeting()}</Text>
            <Text style={styles.headerDate}>{todayStr}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={isPremium ? navigateToSearch : navigateToPremium}
              activeOpacity={0.7}
            >
              <Ionicons name="search-outline" size={20} color={isPremium ? colors.text : colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={navigateToAnalytics}
              activeOpacity={0.7}
            >
              <Ionicons name="analytics-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={navigateToSettings}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Hero Balance ── */}
        <View style={styles.heroCard}>
          {currencyKeys.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyTabsRow}>
              {currencyKeys.map(curr => (
                <TouchableOpacity
                  key={curr}
                  style={[styles.currencyTab, selectedCurrency === curr && styles.currencyTabActive]}
                  onPress={() => handleCurrencySelect(curr)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.currencyTabText, selectedCurrency === curr && styles.currencyTabTextActive]}>{curr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.heroLabelRow}>
            <Text style={styles.heroLabel}>TOTAL BALANCE</Text>
            <StreakBadge />
          </View>

          <MoneyText
            amount={balancesByCurrency[selectedCurrency] || 0}
            currency={selectedCurrency}
            style={styles.heroAmount}
            weight="bold"
          />

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <View style={[styles.statDot, { backgroundColor: colors.success }]} />
              <View style={styles.statBody}>
                <Text style={styles.statLabel}>INCOME</Text>
                <MoneyText amount={totals.income} currency={selectedCurrency} type="CR" weight="bold" style={styles.statValue} />
              </View>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.heroStatItem}>
              <View style={[styles.statDot, { backgroundColor: colors.danger }]} />
              <View style={styles.statBody}>
                <Text style={styles.statLabel}>EXPENSES</Text>
                <MoneyText amount={totals.expense} currency={selectedCurrency} type="DR" weight="bold" style={styles.statValue} />
              </View>
            </View>
          </View>

          <View style={styles.flowBar}>
            <View style={[styles.flowBarIn, { flex: incomeBarRatio }]} />
            <View style={[styles.flowBarOut, { flex: 1 - incomeBarRatio }]} />
          </View>
        </View>

        {/* ── Insights (premium) ── */}
        <View style={styles.divider} />
        <InsightsSection currency={selectedCurrency} />

        {/* ── Quick actions ── */}
        <View style={styles.divider} />
        <View style={styles.actionStrip}>
          <TouchableOpacity style={styles.actionPrimary} onPress={navigateToCreateTransaction} activeOpacity={0.85}>
            <Ionicons name="add" size={16} color={colors.background} />
            <Text style={styles.actionPrimaryText}>Add transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionSecondary} onPress={navigateToTransactions} activeOpacity={0.85}>
            <Text style={styles.actionSecondaryText}>View all</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* ── Accounts ── */}
        <View style={styles.divider} />
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>ACCOUNTS</Text>
          <TouchableOpacity onPress={openAccountForm} activeOpacity={0.7}>
            <Text style={styles.sectionAction}>New</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.accountsScroll}
          contentContainerStyle={styles.accountsScrollContent}
        >
          {accounts?.map(acc => {
            const accColor = colorNumberToHex(acc.color);
            return (
              <TouchableOpacity
                key={acc.id}
                style={styles.accountCard}
                onPress={() => navigateToAccountTransactions(acc.id)}
                onLongPress={() => handleAccountLongPress(acc)}
                delayLongPress={250}
                activeOpacity={0.88}
              >
                <View style={styles.accountCardInner}>
                  <View style={styles.accountCardTop}>
                    <View style={styles.accountCardLead}>
                      <IconAvatar icon={resolveIconName(acc.icon, 'wallet-outline')} bg={accColor + '20'} color={accColor} size={38} iconSize={18} />
                      <View style={styles.accountCardMeta}>
                        <Text style={styles.accountCardName} numberOfLines={1}>{acc.name}</Text>
                        <Text style={styles.accountCardHint}>
                          {acc.accountNumber && acc.accountNumber !== 'N/A'
                            ? `•••• ${acc.accountNumber.slice(-4)}`
                            : 'Tap to view activity'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.accountCurrencyBadge}>
                      <Text style={[styles.accountCurrencyText, { color: accColor }]}>{acc.currency}</Text>
                    </View>
                  </View>

                  <Text style={styles.accountBalanceLabel}>AVAILABLE</Text>
                  <MoneyText amount={acc.balance} currency={acc.currency} style={styles.accountCardBalance} weight="bold" />

                  <View style={styles.accountCardStats}>
                    <View style={styles.accountCardStatCol}>
                      <Text style={styles.accountCardStatLabel}>TOTAL IN</Text>
                      <MoneyText amount={acc.income} currency={acc.currency} style={styles.accountCardStatValue} type="CR" compact />
                    </View>
                    <View style={styles.accountCardStatDivider} />
                    <View style={styles.accountCardStatCol}>
                      <Text style={styles.accountCardStatLabel}>TOTAL OUT</Text>
                      <MoneyText amount={acc.expense} currency={acc.currency} style={styles.accountCardStatValue} type="DR" compact />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.accountPlaceholderCard}
            onPress={openAccountForm}
            activeOpacity={0.88}
          >
            <View style={styles.accountPlaceholderInner}>
              <IconAvatar icon="add" bg={colors.background + '88'} color={colors.text} size={44} iconSize={22} style={{ marginBottom: 14 }} />
              <Text style={styles.accountPlaceholderTitle}>New Account</Text>
              <Text style={styles.accountPlaceholderText}>Add another wallet, bank, or cash account.</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Top expense categories ── */}
        <View style={styles.divider} />
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>TOP EXPENSES</Text>
          <Text style={[styles.sectionAction, { color: colors.textMuted }]}>{selectedTopCategoryCurrency}</Text>
        </View>
        <TopExpenseCategoriesCard
          currencies={topCategoryCurrencies}
          selectedCurrency={selectedTopCategoryCurrency}
          onSelectCurrency={setSelectedTopCategoryCurrency}
          categories={topExpenseCategories}
        />

        {/* ── Recent activity ── */}
        <View style={styles.divider} />
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>RECENT</Text>
          <TouchableOpacity onPress={navigateToTransactions} activeOpacity={0.7}>
            <Text style={styles.sectionAction}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityCard}>
          {transactions && transactions.length > 0 ? (
            transactions.slice(0, 6).map((tx, idx) => {
              const isLast = idx === Math.min(transactions.length, 6) - 1;
              return (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  isFirst={idx === 0}
                  isLast={isLast}
                  showDate
                  onPress={() => navigateToEditTransaction(tx.id)}
                />
              );
            })
          ) : (
            <View style={styles.emptyActivity}>
              <Ionicons name="receipt-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyActivityText}>No transactions yet</Text>
              <TouchableOpacity style={styles.emptyActivityAction} onPress={navigateToCreateTransaction}>
                <Text style={styles.emptyActivityActionText}>Add one now</Text>
                <Ionicons name="arrow-forward" size={12} color={colors.background} />
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={navigateToCreateTransaction} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color={colors.background} />
      </TouchableOpacity>

      <OptionsDialog
        visible={showAccountOptionsDialog}
        onClose={closeOptionsDialog}
        title="Manage Account"
        subtitle={activeAccount?.name}
        options={accountOptions}
      />

      <ConfirmDialog
        visible={showDeleteAccountDialog}
        onClose={closeDeleteDialog}
        title="Delete Account"
        message={activeAccount ? `Delete ${activeAccount.name}? This action cannot be undone.` : undefined}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
      />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType, screenWidth: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 110,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing('2'),
    paddingBottom: spacing('5'),
  },
  headerLeft: {
    gap: spacing('1'),
  },
  headerGreeting: {
    fontFamily: typography.fonts.bold,
    color: colors.text,
    fontSize: 22,
    letterSpacing: -0.5,
  },
  headerDate: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('6'),
  },

  /* ── Hero balance ── */
  heroCard: {
    marginHorizontal: layout.screenPadding,
    marginBottom: spacing('5'),
    borderRadius: radius('xl'),
    backgroundColor: colors.surface,
    padding: spacing('5'),
  },
  currencyTabsRow: {
    flexDirection: 'row',
    gap: spacing('1'),
    marginBottom: spacing('4'),
  },
  currencyTab: {
    paddingHorizontal: spacing('3'),
    paddingVertical: spacing('1.5') - 1,
    borderRadius: radius('full'),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyTabActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  currencyTabText: {
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  currencyTabTextActive: {
    color: colors.background,
  },
  heroLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing('1.5'),
  },
  heroLabel: {
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  heroAmount: {
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1.5,
    marginBottom: spacing('5'),
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing('3.5'),
  },
  heroStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('2'),
    minWidth: 0,
  },
  statBody: {
    flex: 1,
    minWidth: 0,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: radius('full'),
    flexShrink: 0,
  },
  statLabel: {
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: spacing('0.5'),
  },
  statValue: {
    fontSize: 15,
  },
  statSeparator: {
    width: 1,
    height: 34,
    backgroundColor: colors.border,
    marginHorizontal: spacing('4'),
  },
  flowBar: {
    flexDirection: 'row',
    height: 3,
    borderRadius: radius('full'),
    overflow: 'hidden',
    gap: spacing('0.5'),
  },
  flowBarIn: {
    borderRadius: radius('full'),
    backgroundColor: colors.success,
  },
  flowBarOut: {
    borderRadius: radius('full'),
    backgroundColor: colors.danger,
  },

  /* ── Section divider ── */
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.5,
    marginHorizontal: layout.screenPadding,
  },

  /* ── Quick actions ── */
  actionStrip: {
    flexDirection: 'row',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing('4'),
    gap: spacing('2.5'),
  },
  actionPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing('2'),
    height: 46,
    borderRadius: radius('lg'),
    backgroundColor: colors.text,
  },
  actionPrimaryText: {
    fontFamily: typography.fonts.semibold,
    color: colors.background,
    fontSize: 14,
  },
  actionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing('1.5'),
    height: 46,
    borderRadius: radius('lg'),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionSecondaryText: {
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    fontSize: 14,
  },

  /* ── Section rows ── */
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing('5'),
    paddingBottom: spacing('3'),
  },
  sectionLabel: {
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  sectionAction: {
    fontFamily: typography.fonts.semibold,
    color: colors.primary,
    fontSize: 12,
  },

  /* ── Accounts carousel ── */
  accountsScroll: {
    paddingLeft: spacing('6'),
  },
  accountsScrollContent: {
    paddingRight: spacing('7'),
    gap: spacing('3'),
    paddingBottom: spacing('1'),
  },
  accountCard: {
    width: screenWidth * 0.7,
    minHeight: 160,
    borderRadius: radius('xl'),
    backgroundColor: colors.surface,
  },
  accountPlaceholderCard: {
    width: screenWidth * 0.7,
    minHeight: 160,
    borderRadius: radius('xl'),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  accountPlaceholderInner: {
    flex: 1,
    minHeight: 157,
    padding: spacing('4'),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  accountPlaceholderTitle: {
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing('1.5'),
  },
  accountPlaceholderText: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 180,
  },
  accountCardInner: {
    padding: spacing('3.5'),
  },
  accountCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing('3'),
    gap: spacing('2.5'),
  },
  accountCardLead: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('2.5'),
  },
  accountCardMeta: {
    flex: 1,
  },
  accountCardName: {
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    fontSize: 14,
  },
  accountCardHint: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing('0.5'),
  },
  accountCurrencyBadge: {
    height: 24,
    minWidth: 48,
    paddingHorizontal: spacing('2'),
    borderRadius: radius('full'),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background + '80',
  },
  accountCurrencyText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  accountBalanceLabel: {
    fontFamily: typography.fonts.semibold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: spacing('1.5'),
  },
  accountCardBalance: {
    fontSize: 18,
    lineHeight: 22,
    marginBottom: spacing('3'),
  },
  accountCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountCardStatCol: {
    flex: 1,
    gap: spacing('1'),
  },
  accountCardStatLabel: {
    fontFamily: typography.fonts.semibold,
    fontSize: 8,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  accountCardStatValue: {
    fontSize: 11,
  },
  accountCardStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: spacing('3'),
  },

  /* ── Recent activity ── */
  activityCard: {
    marginHorizontal: layout.screenPadding,
    borderRadius: radius('xl'),
    overflow: 'hidden',
  },
  emptyActivity: {
    paddingVertical: spacing('8'),
    alignItems: 'center',
    gap: spacing('2'),
  },
  emptyActivityText: {
    fontFamily: typography.fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyActivityAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('1.5'),
    height: 30,
    paddingHorizontal: spacing('3'),
    borderRadius: radius('full'),
    backgroundColor: colors.primary,
    marginTop: spacing('1'),
  },
  emptyActivityActionText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 11,
    color: colors.background,
  },

  /* ── FAB ── */
  fab: {
    position: 'absolute',
    bottom: spacing('7'),
    right: spacing('7'),
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
