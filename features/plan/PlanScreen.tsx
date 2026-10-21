import type { LoanWithStats } from '@/data/repositories/loans';
import { Card, Column, Columns, EmptyState, Header, IconCircle, ListGroup, ListRow, LockedCard, Screen, Section, Select, Skeleton, SplitBar, useTheme } from '@/design';
import { BudgetList, byUrgency, useBudgets } from '@/features/budgets';
import { TabTip } from '@/features/guide';
import { LoanRow, useLoans } from '@/features/loans';
import { initialsOf } from '@/features/people';
import { dueWording, loanTotals, planLoans } from '@/features/plan/plan-rules';
import { PRO_FEATURES, featuresIn, isOverFreeLimit, usePro, useProCopy } from '@/features/pro';
import { RecurringRow, stateOf, upcoming, useRecurringRules, useRepeatWords, useToday } from '@/features/recurring';
import type { RuleState } from '@/features/recurring';
import { useSettings } from '@/features/settings';
import { addDays } from '@/shared/calc/recurrence';
import { currencyName, sortCurrenciesWithDefault } from '@/shared/currency/currencies';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/** What Pro will add to this tab: the Plan features not out yet, named from the registry. */
const SOON = featuresIn('plan').filter((id) => PRO_FEATURES[id].status !== 'live');

/** Running items first, soonest next; then those that make nothing, in the order they need a look. */
const STATE_ORDER: Record<RuleState, number> = { running: 0, paused: 1, ended: 2, stopped: 3 };

/** How far ahead Upcoming looks. */
const UPCOMING_DAYS = 30;

/**
 * The Plan tab, as sections that each read the same way: a heading, its own
 * "Add", and what it holds. Budgets, repeating items, what is coming in the next
 * 30 days, then loans in the order they need attention. One currency at a time,
 * as on Home. Goals take their place here as they are released.
 */
export function PlanScreen() {
  const { t } = useTranslation(['plan', 'common', 'recurring']);
  const { colors, size, space } = useTheme();
  const router = useRouter();
  const { profile } = useSettings();
  const { isPro, openPaywall } = usePro();
  const proCopy = useProCopy();
  const { data: loans, isPending } = useLoans();
  const { data: budgets } = useBudgets();
  const { data: rules } = useRecurringRules();
  const words = useRepeatWords();
  const day = useToday();
  const [showSettled, setShowSettled] = useState(false);

  const currencies = useMemo(() => sortCurrenciesWithDefault([...new Set([
    profile.defaultCurrency,
    ...(loans ?? []).map((loan) => loan.currency),
    ...(budgets ?? []).map((budget) => budget.currency),
    ...(rules ?? []).flatMap((rule) => (rule.account ? [rule.account.currency] : [])),
  ])], profile.defaultCurrency), [loans, budgets, rules, profile.defaultCurrency]);
  const [chosen, setChosen] = useState<string | null>(null);
  const currency = chosen && currencies.includes(chosen) ? chosen : currencies[0]!;

  const { dated, undated, settled } = useMemo(() => planLoans(loans ?? [], currency), [loans, currency]);
  const totals = useMemo(() => loanTotals(loans ?? [], currency), [loans, currency]);
  const today = new Date();

  const lend = () => router.push('/loans/new');
  // One more than the free plan keeps is offered through Pro, from the same control.
  const addBudget = () => (!isPro && isOverFreeLimit('budgets', budgets?.length ?? 0) ? openPaywall('unlimited') : router.push('/budgets/new'));
  // The budget closest to its limit comes first: it is the one being looked for.
  const inCurrency = byUrgency((budgets ?? []).filter((budget) => budget.currency === currency));
  const open = (loan: LoanWithStats) => router.push({ pathname: '/loans/[id]', params: { id: loan.id } });

  // An item whose account was deleted has no currency left: it is shown in every one, as it needs a look.
  const repeating = useMemo(
    () => (rules ?? [])
      .filter((rule) => !rule.account || rule.account.currency === currency)
      .sort((a, b) => STATE_ORDER[stateOf(a)] - STATE_ORDER[stateOf(b)] || a.nextDue.localeCompare(b.nextDue) || a.id - b.id),
    [rules, currency],
  );
  // A third item on the free plan is offered through Pro, from the same control.
  const addRepeating = () => (!isPro && isOverFreeLimit('recurring', rules?.length ?? 0) ? openPaywall('unlimited') : router.push({ pathname: '/add', params: { kind: 'expense', repeat: '1' } }));
  const openRule = (id: number) => router.push({ pathname: '/recurring/[id]', params: { id } });

  // The next 30 days: each time an item falls, and each loan due, in date order.
  const coming = useMemo(() => {
    const last = addDays(day, UPCOMING_DAYS);
    const items = upcoming(repeating, day, UPCOMING_DAYS).map((next) => ({ day: next.day, rule: repeating.find((rule) => rule.id === next.ruleId)!, loan: null }));
    const due = dated.filter((loan) => loan.dueDate!.slice(0, 10) >= day && loan.dueDate!.slice(0, 10) <= last).map((loan) => ({ day: loan.dueDate!.slice(0, 10), rule: null, loan }));
    // On the same day, items before loans: a stable sort keeps them so.
    return [...items, ...due].sort((a, b) => a.day.localeCompare(b.day));
  }, [repeating, dated, day]);
  // Each section has its own "Add", so the header carries only the currency, where more than one is held.
  const header = <Header title={t('title')} right={currencies.length > 1 ? <View style={{ marginEnd: space.sm }}><Select title={t('common:pickCurrency')} options={currencies.map((code) => ({ key: code, label: code, detail: currencyName(code) }))} value={currency} onChange={setChosen} accessibilityLabel={t('currency')} /></View> : undefined} />;

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
      items={SOON.map((id) => ({ icon: PRO_FEATURES[id].icon, title: proCopy.feature(id).title, detail: proCopy.feature(id).description }))}
      actionLabel={t('soon.action')}
      onAction={() => openPaywall()}
    />
  );

  if (isPending || !loans || !budgets || !rules) {
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
      {/* On a tablet on its side, budgets stand beside loans. */}
      <Columns>
        <Column>
          <Section title={t('budgets.title')} hint={inCurrency.length ? t('budgets.hint') : undefined} actionLabel={inCurrency.length ? t('budgets.add') : undefined} onAction={addBudget}>
            <BudgetList budgets={inCurrency} onOpen={(id) => router.push({ pathname: '/budgets/[id]', params: { id } })} onAdd={addBudget} />
          </Section>

          <Section title={t('recurring:list.title')} hint={repeating.length ? t('recurring:list.hint') : undefined} actionLabel={repeating.length ? t('recurring:list.add') : undefined} onAction={addRepeating}>
            {repeating.length > 0 ? (
              <ListGroup>
                {repeating.map((rule) => <RecurringRow key={rule.id} rule={rule} onPress={() => openRule(rule.id)} />)}
              </ListGroup>
            ) : (
              <EmptyState compact icon="repeat" color="lilac" title={t('recurring:list.empty.title')} body={t('recurring:list.empty.body')} actionLabel={t('recurring:list.empty.action')} onAction={addRepeating} />
            )}
          </Section>
        </Column>
        <Column>
          {/* Nothing in the next 30 days: no heading over nothing. */}
          {coming.length > 0 ? (
            <Section title={t('recurring:upcoming.title')} hint={t('recurring:upcoming.hint')}>
              <ListGroup>
                {coming.map((entry) => (entry.rule ? (
                  <RecurringRow key={`r${entry.rule.id}-${entry.day}`} rule={entry.rule} line={words.day(entry.day)} onPress={() => openRule(entry.rule.id)} />
                ) : (
                  <ListRow
                    key={`l${entry.loan.id}`}
                    leading={entry.loan.personName ? <IconCircle initials={initialsOf(entry.loan.personName)} color={colorNumberToHex(entry.loan.personColor ?? 0)} /> : <IconCircle icon="hand-coins" />}
                    strong
                    title={entry.loan.type === 'lend'
                      ? (entry.loan.personName ? t('recurring:upcoming.owesYou', { name: entry.loan.personName }) : t('recurring:upcoming.someoneOwes'))
                      : (entry.loan.personName ? t('recurring:upcoming.youOwe', { name: entry.loan.personName }) : t('recurring:upcoming.youOweSomeone'))}
                    subtitle={t('recurring:upcoming.loan', { date: words.day(entry.day) })}
                    value={formatCurrency(entry.loan.outstanding, entry.loan.currency)}
                    valueTone={entry.loan.type === 'lend' ? 'positive' : 'default'}
                    onPress={() => open(entry.loan)}
                  />
                )))}
              </ListGroup>
            </Section>
          ) : null}

          {/* Loans read as budgets do: a heading with its own "Add", then what it holds. */}
          <Section title={t('loans.title')} hint={hasOpen ? t('loans.hint') : undefined} actionLabel={hasOpen ? t('loans.add') : undefined} onAction={lend}>
            <View style={{ gap: size.cardGap }}>
              {hasOpen ? (
                <>
                  <TabTip id="plan" ready />
                  {/* Owed against owing is only a picture when there is something on both sides; otherwise the list says it already. */}
                  {totals.owed > 0 && totals.owe > 0 ? (
                    <Card>
                      <SplitBar
                        segments={[
                          { label: t('summary.owed'), value: totals.owed, display: formatCurrency(totals.owed, currency), color: colors.brand },
                          { label: t('summary.owe'), value: totals.owe, display: formatCurrency(totals.owe, currency), color: colors.text },
                        ]}
                      />
                    </Card>
                  ) : null}
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
        </Column>
      </Columns>
    </Screen>
  );
}
