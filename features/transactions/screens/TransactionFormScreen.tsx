import {
  Button, Card, CardStack, Dialog, Emblem, Header, IconButton, IconCircle, ListRow, Message, Screen, SegmentedControl, Skeleton, Text, TextField, useTheme,
  useToast,
} from '@/design';
import { CalculatorSheet } from '@/features/transactions/components/CalculatorSheet';
import { PersonPicker, WhenPicker } from '@/features/transactions/components/EntryPickers';
import { AccountStep, AmountStep, CategoryStep } from '@/features/transactions/components/EntrySteps';
import { useTransactionForm } from '@/features/transactions/hooks/useTransactionForm';
import type { TransactionFormOptions } from '@/features/transactions/hooks/useTransactionForm';
import { KINDS, kindOfType, typeOfKind } from '@/features/transactions/transaction-form';
import { useSettings } from '@/features/settings';
import { Analytics } from '@/platform/telemetry';
import { formatDate } from '@/shared/date/date';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import { differenceInCalendarDays } from 'date-fns';
import { usePreventRemove } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import type { StackCard } from '@/design';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type Picker = 'person' | 'when' | 'calculator' | null;

/** "Today", "Yesterday", or the date, with the year only when it is not this one. */
const dayLabel = (date: Date, today: string, yesterday: string): string => {
  const ago = differenceInCalendarDays(new Date(), date);
  if (ago === 0) return today;
  if (ago === 1) return yesterday;
  return formatDate(date, date.getFullYear() === new Date().getFullYear() ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
};

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('');

/**
 * Adding or changing a transaction, as a deck of cards: how much, which
 * account, what for, anything to add. Every card shows the answer it will
 * use, so the entry can be saved from the first card or any other; Save
 * stays grey, with the reason above it, until the entry can be saved.
 */
export function TransactionFormScreen(options: TransactionFormOptions) {
  const { t } = useTranslation(['transactions', 'common']);
  const { size, space } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const toast = useToast();
  const { profile } = useSettings();
  const form = useTransactionForm(options);

  const [picker, setPicker] = useState<Picker>(null);
  /** Which card of the deck is in front. Every entry starts on the amount. */
  const [step, setStep] = useState(0);
  const [failed, setFailed] = useState(false);
  /** Set once the entry is saved or the user has agreed to discard it, so leaving no longer asks. */
  const [mayLeave, setMayLeave] = useState(false);
  /** The navigation the user asked for while there was unsaved input; carried out if they confirm. */
  const [leaving, setLeaving] = useState<Parameters<typeof navigation.dispatch>[0] | null>(null);

  usePreventRemove(form.touched && !mayLeave, ({ data }) => setLeaving(data.action));

  const kind = kindOfType(form.type);
  const currency = form.account?.currency ?? profile.defaultCurrency;
  // Opened from a launcher shortcut there is nothing to go back to, so closing lands on Home.
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const save = async () => {
    try {
      const createdId = await form.save(t('defaultNote'));
      Analytics.track('transaction_saved', { transaction_type: kind, mode: form.editing ? 'edit' : 'create' });
      setMayLeave(true);
      toast.show(
        createdId == null
          ? { message: t('changesSaved') }
          : { message: t(`saved.${kind}`), actionLabel: t('undo'), onAction: () => void form.undo(createdId) },
      );
      // Leaves on the next tick, once `mayLeave` has switched the unsaved-input guard off.
      setTimeout(close, 0);
    } catch {
      setFailed(true);
    }
  };

  if (form.loading) {
    return (
      <Screen sheet header={<Header task onClose={close} closeLabel={t('close')} />}>
        <Skeleton height={size.chip} width="70%" />
        <Skeleton height={size.row * 2} />
        <Skeleton height={size.row * 3} />
      </Screen>
    );
  }

  if (form.missing) {
    return (
      <Screen sheet scroll={false} header={<Header task onClose={close} closeLabel={t('close')} />}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Message illustration={<Emblem icon="receipt" />} title={t('notFound')} />
        </View>
      </Screen>
    );
  }

  const title = form.loanLinked ? (form.isRepayment ? t('loanRepayment') : t('loanPayment')) : form.editing ? t(`editTitle.${kind}`) : t(`addTitle.${kind}`);
  const when = `${dayLabel(form.when, t('common:today'), t('common:yesterday'))} · ${formatDate(form.when, { hour: 'numeric', minute: '2-digit' })}`;
  const blockedLine = form.blocker
    ? form.blocker === 'repaymentTooHigh'
      ? t('blocked.repaymentTooHigh', { max: formatCurrency(form.repaymentLimit ?? 0, currency) })
      : t(`blocked.${form.blocker}`)
    : null;

  const income = form.type === 'CR';
  const next = () => setStep((current) => current + 1);
  const cards: StackCard[] = [
    {
      key: 'amount',
      label: t('step.amount'),
      short: t('short.amount'),
      value: formatCurrency(form.amount ?? 0, currency),
      content: <AmountStep text={form.amountText} amount={form.amount} currency={currency} onChange={form.setAmountText} onCalculator={() => setPicker('calculator')} />,
    },
    {
      key: 'account',
      label: income ? t('step.accountIncome') : t('step.account'),
      short: income ? t('short.accountIncome') : t('short.account'),
      value: form.account?.name ?? t('choose'),
      content: <AccountStep accounts={form.accounts} selectedId={form.account?.id ?? null} onSelect={(id) => { form.setAccountId(id); next(); }} />,
    },
    ...(form.type === 'TR'
      ? [{
          key: 'toAccount',
          label: t('step.toAccount'),
          short: t('short.toAccount'),
          value: form.toAccount?.name ?? t('choose'),
          content: <AccountStep accounts={form.destinations} selectedId={form.toAccount?.id ?? null} onSelect={(id) => { form.setToAccountId(id); next(); }} empty={t('noDestination')} />,
        }]
      : []),
    // A loan payment keeps the loan's own category.
    ...(form.loanLinked
      ? []
      : [{
          key: 'category',
          label: income ? t('step.categoryIncome') : t('step.category'),
          short: t('short.category'),
          value: form.category?.name ?? t('choose'),
          content: <CategoryStep categories={form.offeredCategories} selectedId={form.category?.id ?? null} onSelect={(id) => { form.setCategoryId(id); next(); }} />,
        }]),
    {
      key: 'details',
      label: t('step.details'),
      short: t('short.details'),
      value: `${when} · ${form.note.trim() || t('noNote')}`,
      content: (
        <View style={{ gap: space.lg }}>
          <TextField label={t('note')} value={form.note} onChangeText={form.setNote} placeholder={t('noteOptional')} maxLength={120} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
            <View style={{ flex: 1 }}><TextField label={t('when')} value={when} onPress={() => setPicker('when')} /></View>
            <IconButton icon="calendar" onPress={() => setPicker('when')} accessibilityLabel={t('pickDate')} />
          </View>
          {!form.loanLinked && form.people.length > 0 && form.type !== 'TR' ? (
            <TextField label={t('with')} value={form.person?.name ?? t('noPerson')} onPress={() => setPicker('person')} />
          ) : null}
        </View>
      ),
    },
  ];

  return (
    <Screen
      sheet
      keyboardAware
      header={<Header task title={title} onClose={close} closeLabel={t('close')} />}
      footer={
        <>
          {blockedLine ? <Text variant="callout" tone="muted" align="center">{blockedLine}</Text> : null}
          <Button label={form.editing ? t('saveChanges') : t(`save.${kind}`)} onPress={save} disabled={!!form.blocker} loading={form.saving} />
        </>
      }
    >
      {/* The kind is fixed once saved: changing it would be a different transaction. */}
      {form.editing ? null : (
        <SegmentedControl segments={KINDS.map((option) => ({ key: option, label: t(`kinds.${option}`) }))} value={kind} onChange={(option) => form.setType(typeOfKind(option))} accessibilityLabel={t('kind')} />
      )}

      {form.loanLinked && form.loan ? (
        <Card padded={false}>
          <ListRow
            leading={form.loan.personName ? <IconCircle initials={initialsOf(form.loan.personName)} color={colorNumberToHex(form.loan.personColor ?? 0)} /> : undefined}
            strong
            title={form.loan.personName ?? form.loan.accountName}
            subtitle={form.isRepayment ? t('loanRepayment') : t('loanPayment')}
          />
        </Card>
      ) : null}

      <CardStack cards={cards} active={Math.min(step, cards.length - 1)} onSelect={setStep} />

      <PersonPicker visible={picker === 'person'} onClose={() => setPicker(null)} people={form.people} selectedId={form.person?.id ?? null} onSelect={form.setPersonId} />
      <CalculatorSheet visible={picker === 'calculator'} onClose={() => setPicker(null)} currency={currency} onUse={(amount) => form.setAmountText(String(amount))} />
      <WhenPicker visible={picker === 'when'} onClose={() => setPicker(null)} value={form.when} onChange={form.setWhen} />

      <Dialog visible={!!leaving} onRequestClose={() => setLeaving(null)} title={t('discard.title')} body={t('discard.body')}>
        <Button label={t('discard.confirm')} variant="danger" onPress={() => { const action = leaving; setLeaving(null); setMayLeave(true); if (action) setTimeout(() => navigation.dispatch(action), 0); }} />
        <Button label={t('discard.cancel')} variant="secondary" onPress={() => setLeaving(null)} />
      </Dialog>
      <Dialog visible={failed} onRequestClose={() => setFailed(false)} title={t('saveFailed')} body={t('saveFailedBody')}>
        <Button label={t('tryAgain')} onPress={() => setFailed(false)} />
      </Dialog>
    </Screen>
  );
}
