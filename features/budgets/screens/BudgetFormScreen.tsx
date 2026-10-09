import { AmountField, Button, Card, Dialog, Emblem, FormBlock, Header, IconCircle, ListGroup, ListRow, Message, OptionList, Screen, Sheet, Skeleton, Switch, Text, resolveIcon, useStyles, useTheme, useToast } from '@/design';
import type { OptionGroup, Theme } from '@/design';
import { useAccounts } from '@/features/accounts';
import { budgetBlockerOf, canBudgetAllSpending, draftOfBudget, isBudgetChanged, limitOf, newBudgetDraft, newBudgetOf, unbudgetedCategories } from '@/features/budgets/budget-form';
import type { BudgetDraft, BudgetTarget } from '@/features/budgets/budget-form';
import { spentOn } from '@/features/budgets/budget-view';
import { useBudgets, useCreateBudget, useLastMonthSpend, useUpdateBudget } from '@/features/budgets/hooks/budgets';
import { useCategories } from '@/features/categories';
import { FREE_LIMITS, isOverFreeLimit, usePro } from '@/features/pro';
import { useSettings } from '@/features/settings';
import { useLeaveGuard } from '@/features/shell';
import { Analytics } from '@/platform/telemetry';
import { currencyName, getCurrencySymbol, sortCurrenciesWithDefault } from '@/shared/currency/currencies';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

export type BudgetFormOptions = {
  /** Editing this budget; leave out to add a new one. */
  budgetId?: number;
};

const ALL = 'all';

/**
 * Adding or changing a budget: the limit first, then what it is for. A saved budget keeps its
 * category and currency, since changing either would make it a different budget; only the limit
 * and the carry-over can be changed.
 */
export function BudgetFormScreen({ budgetId }: BudgetFormOptions) {
  const { t } = useTranslation('budgets');
  const { size, space } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();
  const editing = budgetId != null;
  const { isPro, openPaywall } = usePro();
  const { profile } = useSettings();

  const { data: budgets } = useBudgets();
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();
  const { data: lastMonth } = useLastMonthSpend();
  const create = useCreateBudget();
  const update = useUpdateBudget();
  const existing = editing ? budgets?.find((budget) => budget.id === budgetId) : undefined;

  const blank = useMemo(() => newBudgetDraft(profile.defaultCurrency), [profile.defaultCurrency]);
  const [draft, setDraft] = useState<BudgetDraft>(blank);
  /** What the form started as, to tell whether anything was entered. */
  const [initial, setInitial] = useState<BudgetDraft>(blank);
  const [picker, setPicker] = useState<'target' | 'currency' | null>(null);
  const [failed, setFailed] = useState(false);

  // Editing: start from the saved budget, once it has loaded.
  const [readId, setReadId] = useState<number | null>(null);
  if (existing && readId !== existing.id) {
    setReadId(existing.id);
    const read = draftOfBudget(existing);
    setDraft(read);
    setInitial(read);
  }

  const guard = useLeaveGuard(isBudgetChanged(draft, initial));
  const set = <K extends keyof BudgetDraft>(key: K, value: BudgetDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const close = () => (router.canGoBack() ? router.back() : router.replace('/plan'));
  const header = (title?: string) => <Header task title={title} onClose={close} closeLabel={t('close')} />;

  if (!budgets || !categories || !accounts) {
    return (
      <Screen sheet header={header()}>
        <Skeleton height={size.row * 2} />
        <Skeleton height={size.row * 2} />
      </Screen>
    );
  }

  if (editing && !existing) {
    return (
      <Screen sheet scroll={false} header={header()}>
        <View style={styles.centre}>
          <Message illustration={<Emblem icon="pie-chart" color="teal" />} title={t('budget.notFound')} />
        </View>
      </Screen>
    );
  }

  // Reached past the free limit, e.g. from a link: say so, and offer the way forward.
  if (!editing && !isPro && isOverFreeLimit('budgets', budgets.length)) {
    return (
      <Screen sheet scroll={false} header={header(t('form.newTitle'))} footer={<Button label={t('limit.seePro')} onPress={() => openPaywall('unlimited')} />}>
        <View style={styles.centre}>
          <Message illustration={<Emblem icon="pie-chart" color="teal" />} title={t('limit.reached', { count: FREE_LIMITS.budgets })} />
        </View>
      </Screen>
    );
  }

  // A budget is in one currency; only those the user holds are offered.
  const currencies = sortCurrenciesWithDefault([...new Set([profile.defaultCurrency, ...accounts.map((account) => account.currency)])], profile.defaultCurrency);
  const offered = unbudgetedCategories(categories, budgets, draft.currency);
  const allOffered = canBudgetAllSpending(budgets, draft.currency);
  const category = typeof draft.target === 'number' ? categories.find((c) => c.id === draft.target) : undefined;

  // What was spent on it last month, to choose a limit against, once it is known what the budget is for.
  const spentBefore = draft.target !== null && lastMonth ? spentOn({ categoryId: draft.target === ALL ? null : draft.target, currency: draft.currency }, lastMonth) : null;

  const blocker = budgetBlockerOf(draft);
  const saving = create.isPending || update.isPending;

  const setCurrency = (currency: string) => {
    // What is offered depends on the currency, so a choice made for another one is dropped.
    setDraft((current) => ({ ...current, currency, target: null }));
  };

  const save = async () => {
    try {
      if (editing) await update.mutateAsync({ id: budgetId, data: { monthlyLimit: limitOf(draft), rollover: draft.rollover } });
      else await create.mutateAsync(newBudgetOf(draft));
      Analytics.track('budget_saved', { scope: draft.target === 'all' ? 'overall' : 'category', mode: editing ? 'edit' : 'create' });
      guard.release();
      toast.show({ message: editing ? t('form.changesSaved') : t('form.created') });
      // Leaves on the next tick, once the unsaved-input guard is off.
      setTimeout(close, 0);
    } catch {
      setFailed(true);
    }
  };

  const targetGroups: OptionGroup[] = [
    ...(allOffered ? [{ options: [{ key: ALL, title: t('overall'), subtitle: t('form.allHint', { currency: draft.currency }), leading: <IconCircle icon="pie-chart" color="teal" /> }] }] : []),
    { options: offered.map((c) => ({ key: String(c.id), title: c.name, leading: <IconCircle icon={resolveIcon(c.icon, 'tag')} color={colorNumberToHex(c.color)} /> })) },
  ].filter((group) => group.options.length > 0);

  return (
    <Screen
      sheet
      keyboardAware
      header={header(editing ? t('form.editTitle') : t('form.newTitle'))}
      footer={
        <>
          {blocker ? <Text variant="callout" tone="muted" align="center">{t(`form.blocked.${blocker}`)}</Text> : null}
          <Button label={editing ? t('form.save') : t('form.create')} onPress={save} disabled={!!blocker} loading={saving} />
        </>
      }
    >
      <Card style={{ gap: space.sm }}>
        <Text variant="callout" tone="muted">{t('form.amount')}</Text>
        <AmountField value={draft.amountText} onChangeText={(text) => set('amountText', text)} symbol={getCurrencySymbol(draft.currency)} accessibilityLabel={t('form.amount')} focusOnArrival={!editing} />
        {spentBefore === null ? null : <Text variant="callout" tone="muted">{spentBefore > 0 ? t('form.lastMonth', { amount: formatCurrency(spentBefore, draft.currency) }) : t('form.lastMonthNone')}</Text>}
      </Card>

      <FormBlock label={t('form.target')}>
        <Card padded={false}>
          <ListRow
            leading={draft.target === ALL ? <IconCircle icon="pie-chart" color="teal" /> : category ? <IconCircle icon={resolveIcon(category.icon, 'tag')} color={colorNumberToHex(category.color)} /> : undefined}
            icon={draft.target === null ? 'tag' : undefined}
            strong
            title={draft.target === ALL ? t('overall') : category?.name ?? t('form.chooseTarget')}
            subtitle={draft.target === ALL ? t('form.allHint', { currency: draft.currency }) : category ? t('form.targetHint') : undefined}
            // A saved budget keeps what it is for.
            onPress={editing ? undefined : () => setPicker('target')}
          />
        </Card>
      </FormBlock>

      {!editing && currencies.length > 1 ? (
        <FormBlock label={t('form.currency')}>
          <Card padded={false}>
            <ListRow icon="coins-stack" strong title={draft.currency} onPress={() => setPicker('currency')} />
          </Card>
        </FormBlock>
      ) : null}

      <FormBlock label={t('form.options')}>
        <ListGroup>
          <ListRow icon="arrows-clockwise" title={t('form.rollover')} subtitle={t('form.rolloverHint')} trailing={<Switch value={draft.rollover} onValueChange={(value) => set('rollover', value)} accessibilityLabel={t('form.rollover')} />} />
        </ListGroup>
      </FormBlock>

      <Sheet visible={picker === 'target'} onClose={() => setPicker(null)} title={t('form.pickTarget')}>
        <OptionList groups={targetGroups} selectedKey={draft.target === null ? undefined : String(draft.target)} onSelect={(key) => { set('target', key === ALL ? ALL : (Number(key) as BudgetTarget)); setPicker(null); }} />
      </Sheet>
      <Sheet visible={picker === 'currency'} onClose={() => setPicker(null)} title={t('form.pickCurrency')}>
        <OptionList groups={[{ options: currencies.map((code) => ({ key: code, title: code, subtitle: currencyName(code) })) }]} selectedKey={draft.currency} onSelect={(code) => { setCurrency(code); setPicker(null); }} />
      </Sheet>

      <Dialog visible={guard.asking} onRequestClose={guard.stay} title={editing ? t('form.discard.titleEdit') : t('form.discard.title')} body={t('form.discard.body')}>
        <Button label={t('form.discard.confirm')} variant="danger" onPress={guard.leave} />
        <Button label={t('form.discard.cancel')} variant="secondary" onPress={guard.stay} />
      </Dialog>
      <Dialog visible={failed} onRequestClose={() => setFailed(false)} title={t('form.saveFailed')} body={t('form.saveFailedBody')}>
        <Button label={t('form.ok')} onPress={() => setFailed(false)} />
      </Dialog>
    </Screen>
  );
}

const createStyles = (_: Theme) =>
  StyleSheet.create({
    centre: { flex: 1, justifyContent: 'center' },
  });
