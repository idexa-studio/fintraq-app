import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { IconButton } from '@/src/components/ui/IconButton';
import { Screen, SkeletonScreen } from '@/src/components/ui';
import { Icon } from '@/src/components/ui/Icon';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { TransactionRow } from '@/src/features/transactions/components/TransactionRow';
import { useAccount } from '@/src/features/accounts/hooks/accounts';
import { useTransactions } from '@/src/features/transactions/hooks/transactions';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { AccountType } from '@/src/types';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveAccountTypeIcon } from '@/src/utils/icons';
import { ArrowDown01Icon, ArrowUp01Icon, PencilEdit01Icon, ReceiptTextIcon } from '@hugeicons/core-free-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ui/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { alpha } from '@/src/theme/tokens';

const ACCOUNT_TYPE_KEYS: Record<AccountType, 'cash' | 'bank' | 'savings' | 'creditCard' | 'investment' | 'loan' | 'ewallet'> = {
  cash: 'cash', bank: 'bank', savings: 'savings', credit_card: 'creditCard', investment: 'investment', loan: 'loan', ewallet: 'ewallet',
};

export const AccountDetailScreen = React.memo(function AccountDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const accountId = Number(id);
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const { data: account, isLoading } = useAccount(accountId);
  const { data: transactions } = useTransactions(10, { accountId });

  const accColor = useMemo(() => account ? colorNumberToHex(account.color) : colors.primary, [account, colors.primary]);
  const accIcon = useMemo(
    () => resolveAccountTypeIcon(account?.accountType as AccountType | null),
    [account?.accountType],
  );
  const typeLabel = useMemo(
    () => (account?.accountType ? t(`accounts.${ACCOUNT_TYPE_KEYS[account.accountType as AccountType]}`) : ''),
    [account?.accountType, t],
  );

  const handleEdit = useCallback(() => {
    router.push(`/(main)/accounts/form?id=${accountId}`);
  }, [router, accountId]);

  const handleSeeAll = useCallback(() => {
    router.push(`/transactions?accountId=${accountId}`);
  }, [router, accountId]);

  const navigateToEditTx = useCallback((txId: number) => {
    router.push(`/transactions/${txId}`);
  }, [router]);

  const headerRight = useMemo(() => (
    <IconButton icon={PencilEdit01Icon} onPress={handleEdit} accessibilityLabel={t('common.edit')} />
  ), [handleEdit, t]);

  if (isLoading) {
    return (
      <Screen header={{ title: '', showBack: true }} variant="fixed">
        <SkeletonScreen />
      </Screen>
    );
  }

  if (!account) {
    return (
      <Screen header={{ title: t('accounts.account'), showBack: true }} variant="fixed" edges={['top']}>
        <View style={styles.loading}>
          <Text style={styles.missingText}>{t('accounts.notFound')}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={{ title: account.name, showBack: true, rightAction: headerRight }} variant="fixed" edges={['top']}>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Hero card ── */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface }]}>
          <View style={styles.heroTop}>
            <IconAvatar icon={accIcon} color={accColor} variant="subtle" size={56} iconSize={24} />
            <View style={styles.heroMeta}>
              <Text style={styles.heroName} numberOfLines={1}>{account.name}</Text>
              <View style={styles.heroBadgeRow}>
                {typeLabel ? (
                  <View style={[styles.typeBadge, { backgroundColor: alpha(accColor, 'subtle') }]}>
                    <Text style={[styles.typeBadgeText, { color: accColor }]}>{typeLabel}</Text>
                  </View>
                ) : null}
                <View style={[styles.typeBadge, { backgroundColor: alpha(colors.text, 'faint') }]}>
                  <Text style={[styles.typeBadgeText, { color: colors.textMuted }]}>{account.currency}</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.balanceLabel}>{t('accounts.availableBalance')}</Text>
          <MoneyText
            amount={account.balance}
            currency={account.currency}
            weight="bold"
            style={styles.balance}
          />

          {/* ── Stats row ── */}
          <View style={styles.statsRow}>
            <View style={[styles.statTile, { backgroundColor: alpha(colors.success, 'subtle') }]}>
              <View style={styles.statHeader}>
                <Icon icon={ArrowUp01Icon} size={12} color={colors.success} />
                <Text style={styles.statLabel}>{t('accounts.totalIn')}</Text>
              </View>
              <MoneyText
                amount={account.income}
                currency={account.currency}
                type="CR"
                compact
                style={[styles.statValue, { color: colors.success }]}
              />
            </View>
            <View style={[styles.statTile, { backgroundColor: alpha(colors.danger, 'subtle') }]}>
              <View style={styles.statHeader}>
                <Icon icon={ArrowDown01Icon} size={12} color={colors.danger} />
                <Text style={styles.statLabel}>{t('accounts.totalOut')}</Text>
              </View>
              <MoneyText
                amount={account.expense}
                currency={account.currency}
                type="DR"
                compact
                style={[styles.statValue, { color: colors.danger }]}
              />
            </View>
          </View>

          {account.accountNumber && account.accountNumber !== 'N/A' ? (
            <View style={styles.accountNumberRow}>
              <Text style={styles.accountNumberLabel}>{t('accounts.accountNumber')}</Text>
              <Text style={styles.accountNumber}>•••• {account.accountNumber.slice(-4)}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Recent transactions ── */}
        <SectionHeader title={t('accounts.recentTransactions')} rightText={t('accounts.seeAll')} onPressRight={handleSeeAll} noPadding />

        {transactions && transactions.length > 0 ? (
          <View style={styles.txCard}>
            {transactions.map((tx, idx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isFirst={idx === 0}
                isLast={idx === transactions.length - 1}
                showDate
                onPress={() => navigateToEditTx(tx.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={[styles.emptyIcon, { backgroundColor: alpha(colors.primary, 'subtle') }]}>
              <Icon icon={ReceiptTextIcon} size={20} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('accounts.noTransactions')}</Text>
            <Text style={styles.emptySubtext}>{t('accounts.transactionsHint')}</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType, insets: { bottom: number }) =>
  StyleSheet.create({
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    missingText: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.sm,
      color: colors.textMuted,
    },
    scroll: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: insets.bottom > 0 ? insets.bottom + 80 : 100,
    },

    /* ── Hero card ── */
    heroCard: {
      borderRadius: radius('2xl'),
      padding: spacing('5'),
      marginBottom: spacing('4'),
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      marginBottom: spacing('4'),
    },
    heroMeta: {
      flex: 1,
      gap: spacing('1.5'),
    },
    heroName: {
      fontFamily: typography.styles.profileName.fontFamily,
      ...typography.metrics.xl,
      color: colors.text,
    },
    heroBadgeRow: {
      flexDirection: 'row',
      gap: spacing('1.5'),
    },
    typeBadge: {
      paddingHorizontal: spacing('2.5'),
      paddingVertical: spacing('0.5'),
      borderRadius: radius('full'),
    },
    typeBadgeText: {
      fontFamily: typography.fonts.medium,
      ...typography.metrics.xs,
    },
    balanceLabel: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
      color: colors.textMuted,
      marginBottom: spacing('1'),
    },
    balance: {
      ...typography.metrics.display,
      marginBottom: spacing('4'),
    },

    /* ── Stat tiles ── */
    statsRow: {
      flexDirection: 'row',
      gap: spacing('3'),
    },
    statTile: {
      flex: 1,
      borderRadius: radius('xl'),
      paddingVertical: spacing('2.5'),
      paddingHorizontal: spacing('3'),
      gap: spacing('0.5'),
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
    },
    statLabel: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
      color: colors.textMuted,
    },
    statValue: {
      ...typography.metrics.md,
      fontFamily: typography.styles.sectionLabel.fontFamily,
    },

    /* ── Account number ── */
    accountNumberRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing('4'),
      paddingTop: spacing('3'),
      borderTopWidth: 1,
      borderTopColor: alpha(colors.text, 'faint'),
    },
    accountNumberLabel: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
      color: colors.textMuted,
    },
    accountNumber: {
      fontFamily: typography.fonts.medium,
      ...typography.metrics.xs,
      color: colors.text,
    },

    /* ── Section header ── */

    /* ── Transaction list ── */
    txCard: {
      borderRadius: radius('xl'),
      overflow: 'hidden',
    },

    /* ── Empty state ── */
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      paddingVertical: spacing('7'),
      paddingHorizontal: spacing('4'),
      alignItems: 'center',
      gap: spacing('2'),
    },
    emptyIcon: {
      width: 44,
      height: 44,
      borderRadius: radius('md'),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing('1'),
    },
    emptyTitle: {
      fontFamily: typography.styles.emptyTitle.fontFamily,
      ...typography.metrics.md,
      color: colors.text,
    },
    emptySubtext: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
      color: colors.textMuted,
      textAlign: 'center',
      maxWidth: 220,
    },
  });
