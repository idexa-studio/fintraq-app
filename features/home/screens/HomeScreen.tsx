import { FeatureTile, Header, IconButton, Screen, Section, useTheme } from '@/design';
import { useAccounts } from '@/features/accounts';
import { BalanceCard } from '@/features/home/components/BalanceCard';
import { AccountList, PeopleList, RecentList } from '@/features/home/components/HomeLists';
import { MonthCard } from '@/features/home/components/MonthCard';
import { useDashboardPersons } from '@/features/home/hooks/summaries';
import { useHomeBalances } from '@/features/home/hooks/useHomeBalances';
import { useSettings } from '@/features/settings';
import { useTransactions } from '@/features/transactions';
import { hasPossibleTransfer } from '@/shared/calc/transfers';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/** How many accounts, transactions and people Home lists before "See all". */
const ACCOUNTS_SHOWN = 4;
const RECENT_SHOWN = 5;

/** The Home tab: where you stand, and the way to everything done most. */
export function HomeScreen() {
  const { t } = useTranslation(['home', 'common']);
  const { size } = useTheme();
  const router = useRouter();
  const { profile } = useSettings();

  const { data: accounts, isPending: accountsPending } = useAccounts();
  const { data: transactions, isPending: transactionsPending } = useTransactions(RECENT_SHOWN);
  const balances = useHomeBalances(accounts);
  const { currency } = balances;
  const { data: people, isPending: peoplePending } = useDashboardPersons(currency);

  // The accounts in the currency on show come first, so switching currency brings them into view.
  const shownAccounts = accounts ? [...accounts].sort((a, b) => Number(b.currency === currency) - Number(a.currency === currency)).slice(0, ACCOUNTS_SHOWN) : undefined;
  // The same rule the transfer form uses, so the tile never opens a form that cannot be completed.
  const canTransfer = hasPossibleTransfer(accounts ?? []);
  const name = profile.name.trim().split(/\s+/)[0];

  const add = (type: 'DR' | 'CR' | 'TR') => router.push({ pathname: '/transactions/create', params: { type } });
  const lend = () => router.push('/(main)/loans/form');

  return (
    <Screen
      tabbed
      header={
        <Header
          title={name ? t('greeting', { name }) : t('greetingNoName')}
          left={<IconButton icon="search" onPress={() => router.push('/search')} accessibilityLabel={t('search')} />}
          right={<IconButton icon="user-circle" onPress={() => router.push('/settings')} accessibilityLabel={t('settings')} />}
        />
      }
    >
      <Section title={t('balance.title')}>
        <BalanceCard balances={balances} loading={accountsPending} onAddExpense={() => add('DR')} onAddIncome={() => add('CR')} />
      </Section>

      <Section title={t('quick.title')}>
        <View style={{ flexDirection: 'row', gap: size.cardGap }}>
          {canTransfer ? <FeatureTile icon="arrows-left-right" color="lilac" description={t('quick.transferDetail')} label={t('quick.transfer')} onPress={() => add('TR')} /> : null}
          <FeatureTile icon="hand-coins" color="pink" description={t('quick.lendDetail')} label={t('quick.lend')} onPress={lend} />
        </View>
      </Section>

      <Section title={t('month.title')} actionLabel={t('month.link')} onAction={() => router.push('/insights')}>
        <MonthCard currency={currency} />
      </Section>

      <Section title={t('accounts.title')} actionLabel={accounts?.length ? t('common:seeAll') : undefined} onAction={() => router.push('/accounts')}>
        <AccountList accounts={shownAccounts} loading={accountsPending} onOpen={(id) => router.push({ pathname: '/accounts/[id]', params: { id } })} onAdd={() => router.push('/accounts/form')} />
      </Section>

      <Section title={t('recent.title')} actionLabel={transactions?.length ? t('common:seeAll') : undefined} onAction={() => router.push('/activity')}>
        <RecentList transactions={transactions} loading={transactionsPending} onOpen={(id) => router.push({ pathname: '/transactions/[id]', params: { id } })} onAdd={() => add('DR')} />
      </Section>

      <Section title={t('people.title')} actionLabel={people?.length ? t('common:seeAll') : undefined} onAction={() => router.push('/persons')}>
        <PeopleList people={people} currency={currency} loading={peoplePending} onOpen={(id) => router.push({ pathname: '/persons/[id]', params: { id } })} onAdd={() => router.push('/persons/form')} />
      </Section>
    </Screen>
  );
}
