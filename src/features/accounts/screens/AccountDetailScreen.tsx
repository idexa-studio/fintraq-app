import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Button, EmptyState, IconAvatar, IconButton, MoneyText, Screen, SectionHeader, SkeletonScreen, StatColumns, Text } from '@/src/components/ui';
import { useAccount } from '@/features/accounts';
import { TransactionRow } from '@/src/features/transactions/components/TransactionRow';
import { useTransactions } from '@/features/transactions';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { AccountType } from '@/shared/types';
import { colorNumberToHex } from '@/shared/format/color';
import { resolveAccountTypeIcon } from '@/src/utils/icons';

const ACCOUNT_TYPE_KEYS = {
  cash: 'cash',
  bank: 'bank',
  savings: 'savings',
  credit_card: 'creditCard',
  investment: 'investment',
  loan: 'loan',
  ewallet: 'ewallet',
} as const satisfies Record<AccountType, string>;

const RECENT_COUNT = 10;

/** One account: balance and money in/out (same card anatomy as the other summaries), then its activity. */
export const AccountDetailScreen = React.memo(function AccountDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const accountId = Number(id);
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const { data: account, isLoading } = useAccount(accountId);
  const { data: transactions = [] } = useTransactions(RECENT_COUNT, { accountIds: [accountId] });

  if (isLoading) {
    return (
      <Screen header={{ title: '', showBack: true }} variant="fixed" edges={['top']}>
        <SkeletonScreen />
      </Screen>
    );
  }

  if (!account) {
    return (
      <Screen header={{ title: t('accounts.account'), showBack: true }} variant="fixed" edges={['top']}>
        <EmptyState icon="wallet" title={t('accounts.notFound')} />
      </Screen>
    );
  }

  const color = colorNumberToHex(account.color);
  const type = account.accountType as AccountType | null;
  const masked = account.accountNumber && account.accountNumber !== 'N/A' ? `•••• ${account.accountNumber.slice(-4)}` : null;
  const addTransaction = () => router.push(`/transactions/create?accountId=${account.id}`);

  return (
    <Screen
      header={{
        title: account.name,
        showBack: true,
        rightAction: <IconButton icon="pencil-simple" onPress={() => router.push(`/(main)/accounts/form?id=${accountId}`)} accessibilityLabel={t('common.edit')} />,
      }}
      variant="fixed"
      edges={['top']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.top}>
            <IconAvatar icon={resolveAccountTypeIcon(type)} color={color} size={48} />
            <View style={styles.identity}>
              <Text variant="subheading" numberOfLines={1}>
                {account.name}
              </Text>
              <View style={styles.badges}>
                {type ? <Badge label={t(`accounts.${ACCOUNT_TYPE_KEYS[type]}`)} color={color} /> : null}
                <Badge label={account.currency} variant="muted" />
                {masked ? <Badge label={masked} variant="muted" /> : null}
              </View>
            </View>
          </View>

          <View>
            <Text variant="label" tone="muted">
              {t('accounts.availableBalance')}
            </Text>
            <MoneyText
              amount={account.balance}
              currency={account.currency}
              weight="bold"
              style={styles.balance}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            />
          </View>

          <StatColumns
            columns={[
              { key: 'in', label: t('accounts.totalIn'), amount: account.income, currency: account.currency, type: 'CR' },
              { key: 'out', label: t('accounts.totalOut'), amount: account.expense, currency: account.currency, type: 'DR' },
            ]}
          />
        </View>

        <Button title={t('dashboard.addTransaction')} icon="plus" variant="tonal" onPress={addTransaction} fullWidth />

        <View>
          <SectionHeader
            title={t('accounts.recentTransactions')}
            rightText={transactions.length > 0 ? t('accounts.seeAll') : undefined}
            onPressRight={() => router.push(`/transactions?accountId=${accountId}`)}
            noPadding
          />
          {transactions.length > 0 ? (
            transactions.map((tx, idx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isFirst={idx === 0}
                isLast={idx === transactions.length - 1}
                showDate
                onPress={() => router.push(`/transactions/${tx.id}`)}
              />
            ))
          ) : (
            <EmptyState variant="inline" icon="receipt-text" title={t('accounts.noTransactions')} description={t('accounts.transactionsHint')} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
});

const createStyles = ({ colors, spacing, radius, layout, typography }: ThemeContextType, insets: EdgeInsets) =>
  StyleSheet.create({
    content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing('2'), paddingBottom: insets.bottom + spacing('12'), gap: spacing('4') },
    card: { backgroundColor: colors.surface, borderRadius: radius('xl'), padding: spacing('4'), gap: spacing('4') },
    top: { flexDirection: 'row', alignItems: 'center', gap: spacing('3') },
    identity: { flex: 1, gap: spacing('1.5') },
    badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('1.5') },
    balance: typography.metrics.xxxl,
  });
