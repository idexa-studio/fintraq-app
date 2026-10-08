import { FeatureTile, Header, IconButton, Screen, Section, Text, useTheme } from '@/design';
import { useAccounts } from '@/features/accounts';
import { BalanceCard } from '@/features/home/components/BalanceCard';
import { AccountList, PeopleList, RecentList } from '@/features/home/components/HomeLists';
import { MonthCard } from '@/features/home/components/MonthCard';
import { useHomeBalances } from '@/features/home/hooks/useHomeBalances';
import { peopleByStanding, usePeopleWithBalances } from '@/features/people';
import { useSettings } from '@/features/settings';
import { useTransactions } from '@/features/transactions';
import type { Kind } from '@/features/transactions';
import { hasPossibleTransfer } from '@/shared/calc/transfers';
import { currencyName } from '@/shared/currency/currencies';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/** How many accounts, transactions and people Home lists before "See all". */
const ACCOUNTS_SHOWN = 4;
const RECENT_SHOWN = 5;
const PEOPLE_SHOWN = 6;

/** The Home tab: where you stand, and the way to everything done most. */
export function HomeScreen() {
  const { t } = useTranslation(['home', 'common']);
  const { size } = useTheme();
  const router = useRouter();
  const { profile } = useSettings();

  const { data: accounts, isPending: accountsPending } = useAccounts();
  const balances = useHomeBalances(accounts);
  const { currency } = balances;
  // Home is a view of one currency: recent activity is what moved through that currency's accounts.
  const { data: transactions, isPending: transactionsPending } = useTransactions(RECENT_SHOWN, { accountIds: balances.accounts.map((a) => a.id) });
  const { data: everyone, isPending: peoplePending } = usePeopleWithBalances(currency);
  // Whoever has something outstanding first, then the rest by name.
  const people = useMemo(() => (everyone ? peopleByStanding(everyone).flatMap((group) => group.people).slice(0, PEOPLE_SHOWN) : undefined), [everyone]);

  const shownAccounts = accounts ? balances.accounts.slice(0, ACCOUNTS_SHOWN) : undefined;
  // The same rule the transfer form uses, so the tile never opens a form that cannot be completed.
  const canTransfer = hasPossibleTransfer(accounts ?? []);
  const name = profile.name.trim().split(/\s+/)[0];

  const add = (kind: Kind) => router.push({ pathname: '/add', params: { kind } });
  const lend = () => router.push('/loans/new');

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
        <BalanceCard balances={balances} loading={accountsPending} onAddExpense={() => add('expense')} onAddIncome={() => add('income')} onOpenAccounts={() => router.push('/accounts')} />
        {balances.currencies.length > 1 ? <Text variant="callout" tone="muted">{t('balance.scope', { currency: currencyName(currency) })}</Text> : null}
      </Section>

      <Section title={t('quick.title')}>
        <View style={{ flexDirection: 'row', gap: size.cardGap }}>
          {canTransfer ? <FeatureTile icon="arrows-left-right" color="lilac" description={t('quick.transferDetail')} label={t('quick.transfer')} onPress={() => add('transfer')} /> : null}
          <FeatureTile icon="hand-coins" color="pink" description={t('quick.lendDetail')} label={t('quick.lend')} onPress={lend} />
        </View>
      </Section>

      <Section title={t('month.title')} actionLabel={t('month.link')} onAction={() => router.push('/insights')}>
        <MonthCard currency={currency} />
      </Section>

      <Section title={t('accounts.title')} actionLabel={accounts?.length ? t('common:seeAll') : undefined} onAction={() => router.push('/accounts')}>
        <AccountList accounts={shownAccounts} loading={accountsPending} onOpen={(id) => router.push({ pathname: '/accounts/[id]', params: { id } })} onAdd={() => router.push('/accounts/new')} />
      </Section>

      <Section title={t('recent.title')} actionLabel={transactions?.length ? t('common:seeAll') : undefined} onAction={() => router.push('/activity')}>
        <RecentList transactions={transactions} loading={transactionsPending} onOpen={(id) => router.push({ pathname: '/transactions/[id]', params: { id } })} onAdd={() => add('expense')} />
      </Section>

      <Section title={t('people.title')} actionLabel={people?.length ? t('common:seeAll') : undefined} onAction={() => router.push('/people')}>
        <PeopleList people={people} currency={currency} loading={peoplePending} onOpen={(id) => router.push({ pathname: '/people/[id]', params: { id } })} onAdd={() => router.push('/people/new')} />
      </Section>
    </Screen>
  );
}
