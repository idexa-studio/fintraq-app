import type { LoanWithStats } from '@/data/repositories/loans';
import { EmptyState, Header, IconButton, IconCircle, ListGroup, ListRow, LockedCard, Screen, Section, Select, Skeleton, SplitBar, SummaryCard, Text, useTheme } from '@/design';
import { useLoans } from '@/features/loans';
import { initialsOf } from '@/features/people';
import { dueWording, loanTotals, planLoans } from '@/features/plan/plan-rules';
import { PRO_FEATURES, featuresIn, usePro, useProCopy } from '@/features/pro';
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
 * The Plan tab: what is owed either way, then the loans in the order they
 * need attention. One currency at a time, as on Home. Budgets, repeating
 * items and goals take their place here as they are released.
 */
export function PlanScreen() {
  const { t } = useTranslation('plan');
  const { colors, size } = useTheme();
  const router = useRouter();
  const { profile } = useSettings();
  const { isPro, openPaywall } = usePro();
  const proCopy = useProCopy();
  const { data: loans, isPending } = useLoans();
  const [showSettled, setShowSettled] = useState(false);

  const currencies = useMemo(() => sortCurrenciesWithDefault([...new Set([profile.defaultCurrency, ...(loans ?? []).map((loan) => loan.currency)])], profile.defaultCurrency), [loans, profile.defaultCurrency]);
  const [chosen, setChosen] = useState<string | null>(null);
  const currency = chosen && currencies.includes(chosen) ? chosen : currencies[0]!;

  const { dated, undated, settled } = useMemo(() => planLoans(loans ?? [], currency), [loans, currency]);
  const totals = useMemo(() => loanTotals(loans ?? [], currency), [loans, currency]);
  const today = new Date();

  const lend = () => router.push('/loans/new');
  const open = (loan: LoanWithStats) => router.push({ pathname: '/loans/[id]', params: { id: loan.id } });
  const header = <Header title={t('title')} right={<IconButton icon="plus" onPress={lend} accessibilityLabel={t('add')} />} />;

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

  if (isPending || !loans) {
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
      <SummaryCard
        title={t('summary.title')}
        trailing={currencies.length > 1 ? <Select options={currencies.map((code) => ({ key: code, label: code }))} value={currency} onChange={setChosen} accessibilityLabel={t('currency')} /> : null}
        actions={[{ label: t('summary.lend'), onPress: lend }, { label: t('summary.people'), onPress: () => router.push('/people') }]}
      >
          {totals.owed > 0 || totals.owe > 0 ? (
            <SplitBar
              segments={[
                { label: t('summary.owed'), value: totals.owed, display: formatCurrency(totals.owed, currency), color: colors.brand },
                { label: t('summary.owe'), value: totals.owe, display: formatCurrency(totals.owe, currency), color: colors.text },
              ]}
            />
          ) : (
            <Text variant="callout" tone="muted">{t('summary.none')}</Text>
          )}
      </SummaryCard>

      {hasOpen ? (
        <>
          {dated.length > 0 ? (
            <Section title={t('upcoming.title')}>
              <ListGroup>{dated.map((loan) => row(loan, dueLine(loan)))}</ListGroup>
            </Section>
          ) : null}
          {undated.length > 0 ? (
            <Section title={t('upcoming.noDate')}>
              <ListGroup>{undated.map((loan) => row(loan, standing(loan)))}</ListGroup>
            </Section>
          ) : null}
        </>
      ) : (
        <EmptyState compact icon="hand-coins" color="pink" title={t('empty.title')} body={t('empty.body')} actionLabel={t('add')} onAction={lend} />
      )}

      {settled.length > 0 ? (
        <ListGroup>
          <ListRow icon="check-circle" title={showSettled ? t('settled.hide') : t('settled.show', { count: settled.length })} onPress={() => setShowSettled((shown) => !shown)} trailing={<View />} />
          {showSettled ? settled.map((loan) => row(loan, t('settled.row'))) : null}
        </ListGroup>
      ) : null}

      {soon}
    </Screen>
  );
}
