import { FeatureTile, Header, IconButton, Screen, Section, useTheme } from '@/design';
import { useAccounts } from '@/features/accounts';
import { AccountStack } from '@/features/home/components/AccountStack';
import { BalanceCard } from '@/features/home/components/BalanceCard';
import { AccountList, PeopleStrip, RecentList } from '@/features/home/components/HomeLists';
import { MonthCard } from '@/features/home/components/MonthCard';
import { useHomeBalances } from '@/features/home/hooks/useHomeBalances';
import { peopleByStanding, usePeopleWithBalances } from '@/features/people';
import { dayPart, firstName } from '@/features/home/home-rules';
import { formatDate } from '@/shared/date/date';
import { useSettings } from '@/features/settings';
import { useTransactions } from '@/features/transactions';
import type { Kind } from '@/features/transactions';
import { hasPossibleTransfer } from '@/shared/calc/transfers';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/** How many transactions and people Home shows before "See all". */
const RECENT_SHOWN = 5;
const PEOPLE_SHOWN = 8;

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

  // The same rule the transfer form uses, so the tile never opens a form that cannot be completed.
  const canTransfer = hasPossibleTransfer(accounts ?? []);
  const name = firstName(profile.name);
  const now = new Date();
  const part = dayPart(now.getHours());

  const add = (kind: Kind) => router.push({ pathname: '/add', params: { kind } });
  const lend = () => router.push('/loans/new');
  const openAccount = (id: number) => router.push({ pathname: '/accounts/[id]', params: { id } });

  return (
    <Screen
      tabbed
      header={
        <Header
          large
          // The greeting leads into the name; with no name yet, the date leads into the greeting.
          eyebrow={name ? t(`greeting.${part}`) : formatDate(now, { weekday: 'long', day: 'numeric', month: 'long' })}
          title={name || t(`greeting.${part}`)}
          right={
            <>
              <IconButton icon="search" onPress={() => router.push('/search')} accessibilityLabel={t('search')} />
              <IconButton icon="user-circle" onPress={() => router.push('/settings')} accessibilityLabel={t('settings')} />
            </>
          }
        />
      }
    >
      <BalanceCard balances={balances} loading={accountsPending} onAddExpense={() => add('expense')} onAddIncome={() => add('income')} onOpenAccounts={() => router.push('/accounts')} />

      <Section title={t('quick.title')} hint={t('quick.hint')}>
        <View style={{ flexDirection: 'row', gap: size.cardGap }}>
          {canTransfer ? <FeatureTile compact icon="arrows-left-right" color="lilac" description={t('quick.transferDetail')} label={t('quick.transfer')} onPress={() => add('transfer')} /> : null}
          <FeatureTile compact icon="hand-coins" color="pink" description={t('quick.lendDetail')} label={t('quick.lend')} onPress={lend} />
        </View>
      </Section>

      <Section title={t('accounts.title')} hint={balances.accounts.length > 1 ? t('accounts.hint') : undefined} actionLabel={balances.accounts.length ? t('common:seeAll') : undefined} onAction={() => router.push('/accounts')}>
        {balances.accounts.length > 0 ? (
          <AccountStack accounts={balances.accounts} onOpen={openAccount} onOpenAll={() => router.push('/accounts')} />
        ) : (
          <AccountList accounts={accounts ? [] : undefined} loading={accountsPending} onOpen={openAccount} onAdd={() => router.push('/accounts/new')} />
        )}
      </Section>

      <Section title={t('month.title')} hint={t('month.hint')} actionLabel={t('month.link')} onAction={() => router.push('/insights')}>
        <MonthCard currency={currency} />
      </Section>


      <Section title={t('recent.title')} hint={transactions?.length ? t('recent.hint') : undefined} actionLabel={transactions?.length ? t('common:seeAll') : undefined} onAction={() => router.push('/activity')}>
        <RecentList transactions={transactions} loading={transactionsPending} onOpen={(id) => router.push({ pathname: '/transactions/[id]', params: { id } })} onAdd={() => add('expense')} />
      </Section>

      <Section title={t('people.title')} hint={people?.length ? t('people.hint') : undefined} actionLabel={people?.length ? t('common:seeAll') : undefined} onAction={() => router.push('/people')}>
        <PeopleStrip people={people} currency={currency} loading={peoplePending} onOpen={(id) => router.push({ pathname: '/people/[id]', params: { id } })} onAdd={() => router.push('/people/new')} />
      </Section>
    </Screen>
  );
}
