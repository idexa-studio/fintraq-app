import {
  AmountField, Button, Card, Dialog, Emblem, Header, IconButton, IconCircle, ListGroup, ListRow, MarkTile, Message, Screen, Skeleton, TabStrip, Text, TextField, resolveIcon,
  useTheme, useToast,
} from '@/design';
import { accountTypeIcon } from '@/features/accounts';
import { CalculatorSheet } from '@/features/transactions/components/CalculatorSheet';
import { dayLabel } from '@/features/transactions/components/TransactionRow';
import { AccountPicker, CategoryPicker, PersonPicker, WhenPicker } from '@/features/transactions/components/EntryPickers';
import { useTransactionForm } from '@/features/transactions/hooks/useTransactionForm';
import type { TransactionFormOptions } from '@/features/transactions/hooks/useTransactionForm';
import { KINDS, kindOfType, typeOfKind } from '@/features/transactions/transaction-form';
import { useSettings } from '@/features/settings';
import { useLeaveGuard } from '@/features/shell';
import { Analytics } from '@/platform/telemetry';
import { formatDate } from '@/shared/date/date';
import { getCurrencySymbol } from '@/shared/currency/currencies';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import { differenceInCalendarDays } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type Picker = 'account' | 'toAccount' | 'category' | 'person' | 'when' | 'calculator' | null;

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('');

/**
 * Adding or changing a transaction, on one page: what kind, how much, which
 * account, what for, when, with whom. Save stays grey, with the reason
 * above it, until the entry can be saved.
 */
export function TransactionFormScreen(options: TransactionFormOptions) {
  const { t } = useTranslation(['transactions', 'common']);
  const { size, space } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { profile } = useSettings();
  const form = useTransactionForm(options);

  const [picker, setPicker] = useState<Picker>(null);
  const [failed, setFailed] = useState(false);
  const guard = useLeaveGuard(form.touched);

  const kind = kindOfType(form.type);
  const currency = form.account?.currency ?? profile.defaultCurrency;
  // Opened from a launcher shortcut there is nothing to go back to, so closing lands on Home.
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const save = async () => {
    try {
      const createdId = await form.save(t('defaultNote'));
      Analytics.track('transaction_saved', { transaction_type: kind, mode: form.editing ? 'edit' : 'create' });
      guard.release();
      toast.show(
        createdId == null
          ? { message: t('changesSaved') }
          : { message: t(`saved.${kind}`), actionLabel: t('undo'), onAction: () => void form.undo(createdId) },
      );
      // Leaves on the next tick, once the unsaved-input guard is off.
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

  return (
    <Screen
      sheet
      keyboardAware
      header={
        <View>
          {/* The kind is fixed once saved: changing it would be a different transaction. */}
          <Header task flush={!form.editing} title={title} onClose={close} closeLabel={t('close')} />
          {form.editing ? null : (
            <TabStrip tabs={KINDS.map((option) => ({ key: option, label: t(`kinds.${option}`) }))} value={kind} onChange={(option) => form.setType(typeOfKind(option))} accessibilityLabel={t('kind')} />
          )}
        </View>
      }
      footer={
        <>
          {blockedLine ? <Text variant="callout" tone="muted" align="center">{blockedLine}</Text> : null}
          <Button label={form.editing ? t('saveChanges') : t(`save.${kind}`)} onPress={save} disabled={!!form.blocker} loading={form.saving} />
        </>
      }
    >
      <Card style={{ gap: space.sm }}>
        <Text variant="callout" tone="muted">{t('amount')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ flex: 1 }}>
            <AmountField value={form.amountText} onChangeText={form.setAmountText} symbol={getCurrencySymbol(currency)} accessibilityLabel={t('amount')} focusOnArrival={!form.editing} />
          </View>
          <MarkTile icon="calculator" onPress={() => setPicker('calculator')} accessibilityLabel={t('calculator.open')} />
        </View>
      </Card>

      <View style={{ gap: space.md }}>
        <Text variant="bodyStrong">{t('from')}</Text>
        <Card padded={false}>
          <ListRow
            leading={form.account ? <IconCircle icon={accountTypeIcon(form.account.accountType)} color={colorNumberToHex(form.account.color)} /> : undefined}
            icon={form.account ? undefined : 'wallet'}
            strong
            title={form.account?.name ?? t('chooseAccount')}
            subtitle={form.account ? t('available', { amount: formatCurrency(form.account.balance, form.account.currency) }) : undefined}
            onPress={() => setPicker('account')}
          />
        </Card>
      </View>

      {form.type === 'TR' ? (
        <View style={{ gap: space.md }}>
          <Text variant="bodyStrong">{t('to')}</Text>
          <Card padded={false}>
            {form.destinations.length > 0 ? (
              <ListRow
                leading={form.toAccount ? <IconCircle icon={accountTypeIcon(form.toAccount.accountType)} color={colorNumberToHex(form.toAccount.color)} /> : undefined}
                icon={form.toAccount ? undefined : 'wallet'}
                strong
                title={form.toAccount?.name ?? t('chooseAccount')}
                subtitle={form.toAccount ? formatCurrency(form.toAccount.balance, form.toAccount.currency) : undefined}
                onPress={() => setPicker('toAccount')}
              />
            ) : (
              <ListRow icon="warning" title={t('noDestination')} disabled />
            )}
          </Card>
        </View>
      ) : null}

      <View style={{ gap: space.md }}>
        <Text variant="bodyStrong">{t('details')}</Text>
        <ListGroup>
          {form.loanLinked && form.loan ? (
            <ListRow
              leading={form.loan.personName ? <IconCircle initials={initialsOf(form.loan.personName)} color={colorNumberToHex(form.loan.personColor ?? 0)} /> : undefined}
              strong
              title={form.loan.personName ?? form.loan.accountName}
              subtitle={form.isRepayment ? t('loanRepayment') : t('loanPayment')}
            />
          ) : null}
          {!form.loanLinked && form.category ? (
            <ListRow
              leading={<IconCircle icon={resolveIcon(form.category.icon, 'tag')} color={colorNumberToHex(form.category.color)} />}
              strong
              title={form.category.name}
              subtitle={t('category')}
              onPress={() => setPicker('category')}
            />
          ) : null}
          <View style={{ padding: size.cardPadding, gap: space.lg }}>
            <TextField label={t('note')} value={form.note} onChangeText={form.setNote} placeholder={t('noteOptional')} maxLength={120} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
              <View style={{ flex: 1 }}><TextField label={t('when')} value={when} onPress={() => setPicker('when')} /></View>
              <IconButton icon="calendar" onPress={() => setPicker('when')} accessibilityLabel={t('pickDate')} />
            </View>
            {!form.loanLinked && form.people.length > 0 && form.type !== 'TR' ? (
              <TextField label={t('with')} value={form.person?.name ?? t('noPerson')} onPress={() => setPicker('person')} />
            ) : null}
          </View>
        </ListGroup>
      </View>

      <AccountPicker title={t('pick.account')} visible={picker === 'account'} onClose={() => setPicker(null)} accounts={form.accounts} selectedId={form.account?.id ?? null} onSelect={form.setAccountId} />
      <AccountPicker title={t('pick.toAccount')} visible={picker === 'toAccount'} onClose={() => setPicker(null)} accounts={form.destinations} selectedId={form.toAccount?.id ?? null} onSelect={form.setToAccountId} />
      <CategoryPicker visible={picker === 'category'} onClose={() => setPicker(null)} categories={form.offeredCategories} selectedId={form.category?.id ?? null} onSelect={form.setCategoryId} />
      <PersonPicker visible={picker === 'person'} onClose={() => setPicker(null)} people={form.people} selectedId={form.person?.id ?? null} onSelect={form.setPersonId} />
      <CalculatorSheet visible={picker === 'calculator'} onClose={() => setPicker(null)} currency={currency} onUse={(amount) => form.setAmountText(String(amount))} />
      <WhenPicker visible={picker === 'when'} onClose={() => setPicker(null)} value={form.when} onChange={form.setWhen} />

      <Dialog visible={guard.asking} onRequestClose={guard.stay} title={t('discard.title')} body={t('discard.body')}>
        <Button label={t('discard.confirm')} variant="danger" onPress={guard.leave} />
        <Button label={t('discard.cancel')} variant="secondary" onPress={guard.stay} />
      </Dialog>
      <Dialog visible={failed} onRequestClose={() => setFailed(false)} title={t('saveFailed')} body={t('saveFailedBody')}>
        <Button label={t('tryAgain')} onPress={() => setFailed(false)} />
      </Dialog>
    </Screen>
  );
}
