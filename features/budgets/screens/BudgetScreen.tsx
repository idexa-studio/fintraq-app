import { Button, Dialog, Emblem, Header, IconButton, ListGroup, ListRow, Message, Screen, Section, Sheet, Skeleton, Text, useStyles, useTheme, useToast } from '@/design';
import type { Theme } from '@/design';
import { useAccounts } from '@/features/accounts';
import { BudgetHead } from '@/features/budgets/components/BudgetHead';
import { useBudgets, useDeleteBudget } from '@/features/budgets/hooks/budgets';
import { TransactionRow, useTransactions } from '@/features/transactions';
import { formatCurrency } from '@/shared/format/money';
import { format, startOfMonth } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/** How many of the month's transactions the screen lists before "See all". */
const SHOWN = 8;
const DAY = 'yyyy-MM-dd';

/**
 * One budget: what is left and where the month is heading, then the transactions that counted
 * towards it this month.
 */
export function BudgetScreen() {
  const { t } = useTranslation(['budgets', 'common']);
  const { size } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ id: string }>();
  const parsed = Number(params.id);
  const id = Number.isFinite(parsed) ? parsed : -1;

  const { data: budgets, isPending } = useBudgets();
  const { data: accounts } = useAccounts();
  const remove = useDeleteBudget();
  const budget = budgets?.find((item) => item.id === id);

  const today = new Date();
  const from = format(startOfMonth(today), DAY);
  const to = format(today, DAY);
  // The same rows the figure is counted from: expenses this month, in the budget's currency and category.
  const accountIds = (accounts ?? []).filter((account) => account.currency === budget?.currency).map((account) => account.id);
  const { data: transactions } = useTransactions(SHOWN + 1, { types: ['DR'], accountIds, categoryIds: budget?.categoryId != null ? [budget.categoryId] : undefined, startDate: from, endDate: to, withoutLoans: true });

  const [managing, setManaging] = useState(false);
  const [asking, setAsking] = useState(false);
  const [failed, setFailed] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/plan'));

  if (isPending) {
    return (
      <Screen header={<Header onBack={back} backLabel={t('back')} />}>
        <Skeleton height={size.row * 4} />
        <Skeleton height={size.row * 3} />
      </Screen>
    );
  }

  if (!budget) {
    return (
      <Screen scroll={false} header={<Header onBack={back} backLabel={t('back')} />}>
        <View style={styles.centre}>
          <Message illustration={<Emblem icon="pie-chart" color="teal" />} title={t('budget.notFound')} />
        </View>
      </Screen>
    );
  }

  const confirmDelete = async () => {
    try {
      await remove.mutateAsync(budget.id);
      setAsking(false);
      toast.show({ message: t('budget.deleted') });
      back();
    } catch {
      setAsking(false);
      setFailed(true);
    }
  };

  const rolled = budget.limit - budget.monthlyLimit;
  const rows = (transactions ?? []).slice(0, SHOWN);
  const more = (transactions?.length ?? 0) > SHOWN;
  const seeAll = () => router.push({ pathname: '/activity', params: { ...(budget.categoryId != null ? { categoryId: budget.categoryId } : {}), from, to } });

  return (
    <Screen
      header={<Header title={budget.category?.name ?? t('overall')} onBack={back} backLabel={t('back')} right={<IconButton icon="dots-three" onPress={() => setManaging(true)} accessibilityLabel={t('budget.manage')} />} />}
    >
      <BudgetHead budget={budget} today={today} />
      {rolled > 0 ? <Text variant="callout" tone="muted" align="center">{t('budget.rolled', { amount: formatCurrency(rolled, budget.currency) })}</Text> : null}

      <Section title={t('budget.thisMonth')} hint={rows.length ? t('budget.thisMonthHint') : undefined} actionLabel={more ? t('common:seeAll') : undefined} onAction={seeAll}>
        {rows.length > 0 ? (
          <ListGroup>
            {rows.map((tx) => <TransactionRow key={tx.id} transaction={tx} when="day" onPress={() => router.push({ pathname: '/transactions/[id]', params: { id: tx.id } })} />)}
          </ListGroup>
        ) : (
          <Text variant="callout" tone="muted">{t('budget.nothing')}</Text>
        )}
      </Section>

      <Sheet visible={managing} onClose={() => setManaging(false)} title={t('budget.manage')}>
        <ListGroup>
          <ListRow icon="pencil-simple" title={t('budget.edit')} onPress={() => { setManaging(false); router.push({ pathname: '/budgets/[id]/edit', params: { id: budget.id } }); }} />
          <ListRow icon="trash" title={t('budget.delete')} destructive onPress={() => { setManaging(false); setAsking(true); }} trailing={<View />} />
        </ListGroup>
      </Sheet>

      <Dialog visible={asking} onRequestClose={() => setAsking(false)} title={t('budget.deleteTitle')} body={t('budget.deleteBody')}>
        <Button label={t('budget.deleteConfirm')} variant="danger" loading={remove.isPending} onPress={confirmDelete} />
        <Button label={t('budget.keep')} variant="secondary" onPress={() => setAsking(false)} />
      </Dialog>
      <Dialog visible={failed} onRequestClose={() => setFailed(false)} title={t('budget.deleteFailed')} body={t('budget.deleteFailedBody')}>
        <Button label={t('budget.ok')} onPress={() => setFailed(false)} />
      </Dialog>
    </Screen>
  );
}

const createStyles = (_: Theme) =>
  StyleSheet.create({
    centre: { flex: 1, justifyContent: 'center' },
  });
