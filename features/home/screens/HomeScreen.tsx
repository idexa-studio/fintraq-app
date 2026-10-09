import { FeatureTile, Header, IconButton, Notice, Screen, Section, useTheme } from '@/design';
import { useAccounts } from '@/features/accounts';
import { BudgetList, byUrgency, useBudgets } from '@/features/budgets';
import { WhatsNewSheet, useWhatsNew } from '@/features/guide';
import { AccountStack } from '@/features/home/components/AccountStack';
import { BalanceCard } from '@/features/home/components/BalanceCard';
import { GettingStarted } from '@/features/home/components/GettingStarted';
import { AccountList, PeopleStrip, RecentList } from '@/features/home/components/HomeLists';
import { MonthCard } from '@/features/home/components/MonthCard';
import type { GettingStartedStepId } from '@/features/home/getting-started';
import { useGettingStarted } from '@/features/home/hooks/useGettingStarted';
import { useHomeBalances } from '@/features/home/hooks/useHomeBalances';
import { useHomePrompt } from '@/features/home/hooks/useHomePrompt';
import { useAppLock } from '@/features/lock';
import { peopleByStanding, usePeopleWithBalances } from '@/features/people';
import { firstName } from '@/features/home/home-rules';
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
const BUDGETS_SHOWN = 2;

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

  const add = (kind: Kind) => router.push({ pathname: '/add', params: { kind } });
  const lend = () => router.push('/loans/new');
  // The budgets that most need a look, in the currency Home is showing. All of them are on Plan.
  const { data: allBudgets } = useBudgets();
  const budgets = byUrgency((allBudgets ?? []).filter((budget) => budget.currency === currency)).slice(0, BUDGETS_SHOWN);
  const start = useGettingStarted();
  const { prompt, dismiss: dismissPrompt } = useHomePrompt();
  const whatsNew = useWhatsNew();
  // The lock screen is a window of its own; a sheet opened under it would come up over it.
  const { isLocked } = useAppLock();
  const doStep = (id: GettingStartedStepId) => {
    if (id === 'transaction') add('expense');
    else if (id === 'insights') router.push('/insights');
    else if (id === 'budget') router.push('/budgets/new');
    else if (id === 'reminder') router.push('/settings');
    else if (id === 'backup') router.push('/backup');
    else router.push('/accounts/new');
  };
  const openAccount = (id: number) => router.push({ pathname: '/accounts/[id]', params: { id } });

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
      <BalanceCard balances={balances} loading={accountsPending} onAddExpense={() => add('expense')} onAddIncome={() => add('income')} onOpenAccounts={() => router.push('/accounts')} />

      {start.visible ? <GettingStarted steps={start.steps} onStep={doStep} onHide={start.dismiss} /> : null}
      {/* Someone still getting started is not also asked for anything else. */}
      {prompt && !start.visible ? (
        <Notice title={t(`prompt.${prompt}.title`)} body={t(`prompt.${prompt}.body`)} linkLabel={t(`prompt.${prompt}.link`)} onLink={() => router.push(prompt === 'pro' ? '/pro' : '/backup')} onDismiss={dismissPrompt} dismissLabel={t(`prompt.${prompt}.dismiss`)} />
      ) : null}

      {/* In the order they are looked for: how the month stands, what is left to spend, what was just recorded; then what is held, who is owed, and the shortcuts. */}
      <Section title={t('month.title')} hint={t('month.hint')} actionLabel={t('month.link')} onAction={() => router.push('/insights')}>
        <MonthCard currency={currency} />
      </Section>

      {/* Only once there is a budget: making the first one is Plan's and the first steps' job, not another empty card here. */}
      {budgets.length > 0 ? (
        <Section title={t('budgets.title')} hint={t('budgets.hint')} actionLabel={t('common:seeAll')} onAction={() => router.push('/plan')}>
          <BudgetList budgets={budgets} onOpen={(id) => router.push({ pathname: '/budgets/[id]', params: { id } })} onAdd={() => router.push('/budgets/new')} />
        </Section>
      ) : null}

      <Section title={t('recent.title')} hint={transactions?.length ? t('recent.hint') : undefined} actionLabel={transactions?.length ? t('common:seeAll') : undefined} onAction={() => router.push('/activity')}>
        <RecentList transactions={transactions} loading={transactionsPending} onOpen={(id) => router.push({ pathname: '/transactions/[id]', params: { id } })} onAdd={() => add('expense')} />
      </Section>

      <Section title={t('accounts.title')} hint={balances.accounts.length > 1 ? t('accounts.hint') : undefined} actionLabel={balances.accounts.length ? t('common:seeAll') : undefined} onAction={() => router.push('/accounts')}>
        {balances.accounts.length > 0 ? (
          <AccountStack accounts={balances.accounts} onOpen={openAccount} onOpenAll={() => router.push('/accounts')} />
        ) : (
          <AccountList accounts={accounts ? [] : undefined} loading={accountsPending} onOpen={openAccount} onAdd={() => router.push('/accounts/new')} />
        )}
      </Section>

      <Section title={t('people.title')} hint={people?.length ? t('people.hint') : undefined} actionLabel={people?.length ? t('common:seeAll') : undefined} onAction={() => router.push('/people')}>
        <PeopleStrip people={people} currency={currency} loading={peoplePending} onOpen={(id) => router.push({ pathname: '/people/[id]', params: { id } })} onAdd={() => router.push('/people/new')} />
      </Section>

      <Section title={t('quick.title')} hint={t('quick.hint')}>
        <View style={{ flexDirection: 'row', gap: size.cardGap }}>
          {canTransfer ? <FeatureTile icon="arrows-left-right" color="lilac" description={t('quick.transferDetail')} label={t('quick.transfer')} onPress={() => add('transfer')} /> : null}
          <FeatureTile icon="hand-coins" color="pink" description={t('quick.lendDetail')} label={t('quick.lend')} onPress={lend} />
        </View>
      </Section>

      <WhatsNewSheet visible={whatsNew.visible && !isLocked} onClose={whatsNew.dismiss} />
    </Screen>
  );
}
