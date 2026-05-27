import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
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
import { SectionHeader } from '../components/SectionHeader';
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
  const { profile } = useSettings();
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

  // Get stats from the optimized SQL hook
  const { data: statsQueryData } = useDashboardStats(selectedCurrency);
  const totals = React.useMemo(() => statsQueryData ?? { income: 0, expense: 0 }, [statsQueryData]);

  // Get top categories from the optimized SQL hook
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
        <Header
          title="Dashboard"
          rightAction={(
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={isPremium ? navigateToSearch : navigateToPremium}
                activeOpacity={0.85}
              >
                <Ionicons name="search-outline" size={18} color={isPremium ? colors.text : colors.textMuted} />
                {!isPremium && <View style={[styles.proDot, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={navigateToAnalytics}
                activeOpacity={0.85}
              >
                <Ionicons name="analytics-outline" size={18} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={navigateToSettings} activeOpacity={0.85}>
                <Ionicons name="settings-outline" size={19} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}
        />

        {/* ── Hero balance card ── */}
        <View style={styles.heroCard}>
          {/* Currency switcher tabs */}
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

           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
             <Text style={styles.heroBadge}>TOTAL BALANCE</Text>
             <StreakBadge />
           </View>
          <MoneyText
            amount={balancesByCurrency[selectedCurrency] || 0}
            currency={selectedCurrency}
            style={styles.heroBalance}
            weight="bold"
          />

          {/* Income / Expense split bar */}
          <View style={styles.splitRow}>
            <View style={styles.splitItem}>
              <View style={[styles.splitDot, { backgroundColor: colors.success }]} />
              <Text style={styles.splitLabel}>IN</Text>
              <MoneyText amount={totals.income} currency={selectedCurrency} type="CR" weight="bold" style={styles.splitValue} />
            </View>
            <View style={styles.splitDivider} />
            <View style={styles.splitItem}>
              <View style={[styles.splitDot, { backgroundColor: colors.danger }]} />
              <Text style={styles.splitLabel}>OUT</Text>
              <MoneyText amount={totals.expense} currency={selectedCurrency} type="DR" weight="bold" style={styles.splitValue} />
            </View>
          </View>

          {/* Visual bar */}
          <View style={styles.flowBar}>
            <View style={[styles.flowBarIncome, { flex: incomeBarRatio }]} />
            <View style={[styles.flowBarExpense, { flex: 1 - incomeBarRatio }]} />
          </View>
        </View>

        {/* ── Insights Layer (Pro Only) ── */}
        <InsightsSection currency={selectedCurrency} />

        {/* ── Quick actions ── */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionPrimary} onPress={navigateToCreateTransaction} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={colors.background} />
            <Text style={styles.quickActionPrimaryText}>Add Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionSecondary} onPress={navigateToTransactions} activeOpacity={0.85}>
            <Ionicons name="list-outline" size={18} color={colors.text} />
            <Text style={styles.quickActionSecondaryText}>All Transactions</Text>
          </TouchableOpacity>
        </View>

        {/* ── Accounts section ── */}
        <SectionHeader
          title="ACCOUNTS"
          rightText="New"
          onPressRight={openAccountForm}
        />

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
                      <MoneyText amount={acc.income} currency={acc.currency} style={styles.accountCardStatValue} type="CR" />
                    </View>
                    <View style={styles.accountCardStatDivider} />
                    <View style={styles.accountCardStatCol}>
                      <Text style={styles.accountCardStatLabel}>TOTAL OUT</Text>
                      <MoneyText amount={acc.expense} currency={acc.currency} style={styles.accountCardStatValue} type="DR" />
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
        <SectionHeader title="TOP EXPENSE CATEGORIES" rightText={selectedTopCategoryCurrency} />
        <TopExpenseCategoriesCard
          currencies={topCategoryCurrencies}
          selectedCurrency={selectedTopCategoryCurrency}
          onSelectCurrency={setSelectedTopCategoryCurrency}
          categories={topExpenseCategories}
        />

        {/* ── Recent activity ── */}
        <SectionHeader title="RECENT" rightText="See all" onPressRight={navigateToTransactions} />

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

const createStyles = ({ colors, typography }: ThemeContextType, screenWidth: number) => StyleSheet.create({
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

  /* ── Header actions ── */
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  proDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  /* ── Hero balance card ── */
  heroCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    overflow: 'hidden',
  },
  currencyTabsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
  },
  currencyTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.background + 'AA',
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
  heroBadge: {
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroBalance: {
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: -1.5,
    marginBottom: 20,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  splitItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  splitDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  splitLabel: {
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  splitValue: {
    fontSize: 13,
  },
  splitDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: 14,
  },
  flowBar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    gap: 2,
  },
  flowBarIncome: {
    borderRadius: 999,
    backgroundColor: colors.success,
  },
  flowBarExpense: {
    borderRadius: 999,
    backgroundColor: colors.danger,
  },

  /* ── Quick actions ── */
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    gap: 10,
  },
  quickActionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.text,
  },
  quickActionPrimaryText: {
    fontFamily: typography.fonts.semibold,
    color: colors.background,
    fontSize: 14,
  },
  quickActionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionSecondaryText: {
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    fontSize: 14,
  },

  /* ── Accounts carousel ── */
  accountsScroll: {
    paddingLeft: 24,
    marginBottom: 24,
  },
  accountsScrollContent: {
    paddingRight: 32,
    gap: 12,
  },
  accountCard: {
    width: screenWidth * 0.7,
    minHeight: 160,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accountPlaceholderCard: {
    width: screenWidth * 0.7,
    minHeight: 160,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  accountPlaceholderInner: {
    flex: 1,
    minHeight: 157,
    padding: 18,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  accountPlaceholderTitle: {
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    fontSize: 16,
    marginBottom: 6,
  },
  accountPlaceholderText: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 180,
  },
  accountCardInner: {
    padding: 14,
  },
  accountCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  accountCardLead: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    marginTop: 2,
  },
  accountCurrencyBadge: {
    height: 24,
    minWidth: 48,
    paddingHorizontal: 8,
    borderRadius: 999,
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
    marginBottom: 6,
  },
  accountCardBalance: {
    fontSize: 22,
    lineHeight: 25,
    marginBottom: 12,
  },
  accountCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountCardStatCol: {
    flex: 1,
    gap: 4,
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
    marginHorizontal: 12,
  },

  /* ── Recent activity ── */
  activityCard: {
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  emptyActivity: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyActivityText: {
    fontFamily: typography.fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyActivityAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  emptyActivityActionText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 11,
    color: colors.background,
  },

  /* ── FAB ── */
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
});
