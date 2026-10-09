import type { LoanWithStats } from '@/data/repositories/loans';
import { Card, EmptyState, Header, IconCircle, ListGroup, ListRow, LockedCard, Screen, Section, Select, Skeleton, SplitBar, useTheme } from '@/design';
import { BudgetList, useBudgets } from '@/features/budgets';
import { TabTip } from '@/features/guide';
import { LoanRow, useLoans } from '@/features/loans';
import { initialsOf } from '@/features/people';
import { dueWording, loanTotals, planLoans } from '@/features/plan/plan-rules';
import { PRO_FEATURES, featuresIn, isOverFreeLimit, usePro, useProCopy } from '@/features/pro';
import { useSettings } from '@/features/settings';
import { sortCurrenciesWithDefault } from '@/shared/currency/currencies';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/** What Pro will add to this tab: the Plan features not out yet, named from the registry. */
const SOON = featuresIn('plan').filter((id) => PRO_FEATURES[id].status !== 'live');

/**
 * The Plan tab, as sections that each read the same way: a heading, its own
 * "Add", and what it holds. Budgets first, then loans in the order they need
 * attention. One currency at a time, as on Home. Repeating items and goals
 * take their place here as they are released.
 */
export function PlanScreen() {
  const { t } = useTranslation('plan');
  const { colors, size } = useTheme();
  const router = useRouter();
  const { profile } = useSettings();
  const { isPro, openPaywall } = usePro();
  const proCopy = useProCopy();
  const { data: loans, isPending } = useLoans();
  const { data: budgets } = useBudgets();
  const [showSettled, setShowSettled] = useState(false);

  const currencies = useMemo(() => sortCurrenciesWithDefault([...new Set([profile.defaultCurrency, ...(loans ?? []).map((loan) => loan.currency), ...(budgets ?? []).map((budget) => budget.currency)])], profile.defaultCurrency), [loans, budgets, profile.defaultCurrency]);
  const [chosen, setChosen] = useState<string | null>(null);
  const currency = chosen && currencies.includes(chosen) ? chosen : currencies[0]!;

  const { dated, undated, settled } = useMemo(() => planLoans(loans ?? [], currency), [loans, currency]);
  const totals = useMemo(() => loanTotals(loans ?? [], currency), [loans, currency]);
  const today = new Date();

  const lend = () => router.push('/loans/new');
  // One more than the free plan keeps is offered through Pro, from the same control.
  const addBudget = () => (!isPro && isOverFreeLimit('budgets', budgets?.length ?? 0) ? openPaywall('unlimited') : router.push('/budgets/new'));
  const inCurrency = (budgets ?? []).filter((budget) => budget.currency === currency);
  const open = (loan: LoanWithStats) => router.push({ pathname: '/loans/[id]', params: { id: loan.id } });
  // Each section has its own "Add", so the header carries only the currency, where more than one is held.
  const header = <Header title={t('title')} right={currencies.length > 1 ? <Select options={currencies.map((code) => ({ key: code, label: code }))} value={currency} onChange={setChosen} accessibilityLabel={t('currency')} /> : undefined} />;

  const row = (loan: LoanWithStats, line: string) => (
    <ListRow
      key={loan.id}
      leading={loan.personName ? <IconCircle initials={initialsOf(loan.personName)} color={colorNumberToHex(loan.personColor ?? 0)} /> : <IconCircle icon="hand-coins" />}
      strong
      title={loan.personName ?? (loan.type === 'lend' ? t('upcoming.someone') : t('upcoming.unnamed'))}
      subtitle={line}
      value={formatCurrency(loan.computedStatus === 'repaid' ? loan.principal : loan.outstanding, loan.currency)}
      valueTone={loan.type === 'lend' && loan.computedStatus !== 'repaid' ? 'positive' : 'default'}
      onPress={() => open(loan)}
    />
  );
  const openRow = (loan: LoanWithStats, line: string) => <LoanRow key={loan.id} loan={loan} line={line} onOpen={() => open(loan)} />;
  const standing = (loan: LoanWithStats) => (loan.type === 'lend' ? t('upcoming.lent') : t('upcoming.borrowed'));
  const dueLine = (loan: LoanWithStats) => {
    const due = dueWording(loan.dueDate!, today);
    return t('upcoming.line', { standing: standing(loan), due: t(`upcoming.due.${due.key}`, { count: due.count }) });
  };

  const soon = isPro || SOON.length === 0 ? null : (
    <LockedCard
      badge={t('soon.badge')}
      title={t('soon.title')}
      body={t('soon.body')}
      items={SOON.map((id) => ({ icon: PRO_FEATURES[id].icon, title: proCopy.feature(id).title }))}
      actionLabel={t('soon.action')}
      onAction={() => openPaywall()}
    />
  );

  if (isPending || !loans || !budgets) {
    return (
      <Screen tabbed header={header}>
        <Skeleton height={size.row * 2} />
        <Skeleton height={size.row * 3} />
      </Screen>
    );
  }

  const hasOpen = dated.length + undated.length > 0;

  return (
    <Screen tabbed header={header}>
      <Section title={t('budgets.title')} hint={inCurrency.length ? t('budgets.hint') : undefined} actionLabel={inCurrency.length ? t('budgets.add') : undefined} onAction={addBudget}>
        <BudgetList budgets={inCurrency} today={today} onOpen={(id) => router.push({ pathname: '/budgets/[id]', params: { id } })} onAdd={addBudget} />
      </Section>

      {/* Loans read as budgets do: a heading with its own "Add", then what it holds. */}
      <Section title={t('loans.title')} hint={hasOpen ? t('loans.hint') : undefined} actionLabel={hasOpen ? t('loans.add') : undefined} onAction={lend}>
        <View style={{ gap: size.cardGap }}>
          {hasOpen ? (
            <>
              <Card>
                <SplitBar
                  segments={[
                    { label: t('summary.owed'), value: totals.owed, display: formatCurrency(totals.owed, currency), color: colors.brand },
                    { label: t('summary.owe'), value: totals.owe, display: formatCurrency(totals.owe, currency), color: colors.text },
                  ]}
                />
              </Card>
              <TabTip id="plan" ready />
              {/* One list, in the order they need attention: those with a due date first, soonest at the top. Each carries a bar for how much has come back. */}
              <ListGroup>
                {dated.map((loan) => openRow(loan, dueLine(loan)))}
                {undated.map((loan) => openRow(loan, standing(loan)))}
              </ListGroup>
            </>
          ) : (
            <EmptyState compact icon="hand-coins" color="pink" title={t('empty.title')} body={t('empty.body')} actionLabel={t('add')} onAction={lend} />
          )}

          <ListGroup>
            {settled.length > 0 ? <ListRow icon="check-circle" title={showSettled ? t('settled.hide') : t('settled.show', { count: settled.length })} onPress={() => setShowSettled((shown) => !shown)} trailing={<View />} /> : null}
            {showSettled ? settled.map((loan) => row(loan, t('settled.row'))) : null}
            <ListRow icon="users" title={t('summary.people')} subtitle={t('loans.peopleHint')} onPress={() => router.push('/people')} />
          </ListGroup>
        </View>
      </Section>

      {soon}
    </Screen>
  );
}
