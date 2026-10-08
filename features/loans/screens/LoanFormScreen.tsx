import type { LoanType } from '@/data/repositories/loans';
import {
  AmountField, Button, Calendar, Card, Dialog, Emblem, Header, IconButton, IconCircle, ListGroup, ListRow, Message, Screen, Sheet, Skeleton, TabStrip, Text, TextField,
  useStyles, useTheme, useToast,
} from '@/design';
import type { Theme } from '@/design';
import { accountTypeIcon, useAccounts } from '@/features/accounts';
import { useCreateLoan, useLoansCount } from '@/features/loans/hooks/loans';
import { useLoanReminders } from '@/features/loans/hooks/useLoanReminders';
import { DEFAULT_DUE_DAYS, DEFAULT_REMINDER_TIME, NOTE_MAX, isLoanDraftTouched, loanBlockerOf, loanPayloadOf, newLoanDraft } from '@/features/loans/loan-rules';
import type { LoanDraft } from '@/features/loans/loan-rules';
import { initialsOf, usePersons } from '@/features/people';
import { FREE_LIMITS, isOverFreeLimit, usePro } from '@/features/pro';
import { useLeaveGuard } from '@/features/shell';
import { AccountPicker, PersonPicker } from '@/features/transactions';
import { getCurrencySymbol } from '@/shared/currency/currencies';
import { formatDate } from '@/shared/date/date';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

const KINDS: readonly LoanType[] = ['lend', 'borrow'];

export type LoanFormOptions = {
  /** The way the loan starts as, e.g. from a shortcut. */
  initialType?: LoanType;
  /** The person it starts with, e.g. when opened from their page. */
  initialPersonId?: number;
};

/**
 * Recording money lent or borrowed, in the shape of the entry form: which
 * way, how much, with whom, through which account, and when it is due.
 * Saving it also records the payment that moved the money.
 */
export function LoanFormScreen({ initialType = 'lend', initialPersonId }: LoanFormOptions) {
  const { t } = useTranslation('loans');
  const { size, space } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();
  const { isPro, openPaywall } = usePro();

  const { data: accounts } = useAccounts();
  const { data: people } = usePersons();
  const { data: openLoans } = useLoansCount();
  const create = useCreateLoan();
  const reminders = useLoanReminders();

  const [draft, setDraft] = useState<LoanDraft>(() => newLoanDraft(initialType, initialPersonId ?? null, null));
  const [picker, setPicker] = useState<'person' | 'account' | 'due' | null>(null);
  const [failed, setFailed] = useState(false);

  const guard = useLeaveGuard(isLoanDraftTouched(draft));
  const set = <K extends keyof LoanDraft>(key: K, value: LoanDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const close = () => (router.canGoBack() ? router.back() : router.replace('/plan'));
  const header = (flush = false) => <Header task flush={flush} title={t('form.title')} onClose={close} closeLabel={t('close')} />;

  if (!accounts || !people || openLoans === undefined) {
    return (
      <Screen sheet header={header()}>
        <Skeleton height={size.row * 2} />
        <Skeleton height={size.row * 3} />
      </Screen>
    );
  }

  // At the free limit the way forward is Pro: say so before anything is typed.
  if (!isPro && isOverFreeLimit('loans', openLoans)) {
    return (
      <Screen sheet scroll={false} header={header()} footer={<Button label={t('form.seePro')} onPress={() => openPaywall('unlimited')} />}>
        <View style={styles.centre}>
          <Message illustration={<Emblem icon="hand-coins" color="pink" />} title={t('form.limit', { count: FREE_LIMITS.loans })} />
        </View>
      </Screen>
    );
  }

  // Until one is chosen, the account is the default one, as on the entry form.
  const account = accounts.find((a) => a.id === draft.accountId) ?? accounts.find((a) => a.isDefault) ?? accounts[0] ?? null;
  const person = people.find((p) => p.id === draft.personId) ?? null;
  const ready: LoanDraft = { ...draft, accountId: account?.id ?? null, personId: person?.id ?? null };
  const blocker = loanBlockerOf(ready);
  const lending = draft.type === 'lend';
  const today = new Date();

  const save = async () => {
    if (blocker || !account) return;
    try {
      const loan = await create.mutateAsync(loanPayloadOf(ready, account, new Date()));
      // A loan with a due date starts with its reminder on, the day before, as it always has. This
      // asks for nothing: where notifications are not allowed yet, the switch on the loan asks.
      if (loan.dueDate) await reminders.scheduleDueReminderIfAllowed(loan, DEFAULT_DUE_DAYS, DEFAULT_REMINDER_TIME);
      guard.release();
      toast.show({ message: t(`form.created.${draft.type}`) });
      // Leaves on the next tick, once the unsaved-input guard is off.
      setTimeout(close, 0);
    } catch {
      setFailed(true);
    }
  };

  return (
    <Screen
      sheet
      keyboardAware
      header={
        <View>
          {header(true)}
          <TabStrip tabs={KINDS.map((kind) => ({ key: kind, label: t(`form.kinds.${kind}`) }))} value={draft.type} onChange={(kind) => set('type', kind)} accessibilityLabel={t('form.kindLabel')} />
        </View>
      }
      footer={
        <>
          {blocker ? <Text variant="callout" tone="muted" align="center">{t(`form.blocked.${blocker}`)}</Text> : null}
          <Button label={t('form.create')} onPress={save} disabled={!!blocker} loading={create.isPending} />
        </>
      }
    >
      <Card style={{ gap: space.sm }}>
        <Text variant="callout" tone="muted">{t('form.amount')}</Text>
        <AmountField value={draft.amountText} onChangeText={(text) => set('amountText', text)} symbol={getCurrencySymbol(account?.currency ?? '')} accessibilityLabel={t('form.amount')} focusOnArrival />
      </Card>

      <View style={styles.block}>
        <Text variant="bodyStrong">{lending ? t('form.to') : t('form.from')}</Text>
        <Card padded={false}>
          <ListRow
            leading={person ? <IconCircle initials={initialsOf(person.name)} color={colorNumberToHex(person.color)} /> : undefined}
            icon={person ? undefined : 'user'}
            strong
            title={person?.name ?? (lending ? t('form.choosePerson') : t('form.anyone'))}
            onPress={() => setPicker('person')}
          />
        </Card>
      </View>

      <View style={styles.block}>
        <Text variant="bodyStrong">{lending ? t('form.outOf') : t('form.into')}</Text>
        <Card padded={false}>
          <ListRow
            leading={account ? <IconCircle icon={accountTypeIcon(account.accountType)} color={colorNumberToHex(account.color)} /> : undefined}
            icon={account ? undefined : 'wallet'}
            strong
            title={account?.name ?? t('form.chooseAccount')}
            subtitle={account ? t('form.available', { amount: formatCurrency(account.balance, account.currency) }) : undefined}
            onPress={() => setPicker('account')}
          />
        </Card>
      </View>

      <View style={styles.block}>
        <Text variant="bodyStrong">{t('form.details')}</Text>
        <ListGroup>
          <View style={styles.fields}>
            <View style={styles.due}>
              <View style={styles.fill}>
                <TextField label={t('form.due')} value={draft.dueDate ? formatDate(draft.dueDate, { day: 'numeric', month: 'short', year: 'numeric' }) : t('form.noDue')} onPress={() => setPicker('due')} />
              </View>
              {draft.dueDate ? <IconButton icon="x" onPress={() => set('dueDate', null)} accessibilityLabel={t('form.clearDue')} /> : <IconButton icon="calendar" onPress={() => setPicker('due')} accessibilityLabel={t('form.pickDue')} />}
            </View>
            <TextField label={t('form.note')} value={draft.note} onChangeText={(text) => set('note', text)} placeholder={t('form.noteOptional')} maxLength={NOTE_MAX} />
          </View>
        </ListGroup>
      </View>

      <PersonPicker visible={picker === 'person'} onClose={() => setPicker(null)} people={people} selectedId={person?.id ?? null} onSelect={(id) => set('personId', id)} />
      <AccountPicker title={lending ? t('form.outOf') : t('form.into')} visible={picker === 'account'} onClose={() => setPicker(null)} accounts={accounts} selectedId={account?.id ?? null} onSelect={(id) => set('accountId', id)} />
      <Sheet visible={picker === 'due'} onClose={() => setPicker(null)} title={t('form.pickDue')}>
        {/* A due date is ahead of today; the day chosen closes the sheet. */}
        <Calendar value={draft.dueDate ?? today} min={today} onChange={(day) => { set('dueDate', day); setPicker(null); }} />
      </Sheet>

      <Dialog visible={guard.asking} onRequestClose={guard.stay} title={t('form.discard.title')} body={t('form.discard.body')}>
        <Button label={t('form.discard.confirm')} variant="danger" onPress={guard.leave} />
        <Button label={t('form.discard.cancel')} variant="secondary" onPress={guard.stay} />
      </Dialog>
      <Dialog visible={failed} onRequestClose={() => setFailed(false)} title={t('form.saveFailed')} body={t('form.saveFailedBody')}>
        <Button label={t('form.ok')} onPress={() => setFailed(false)} />
      </Dialog>
    </Screen>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    centre: { flex: 1, justifyContent: 'center' },
    fill: { flex: 1 },
    block: { gap: space.md },
    fields: { padding: size.cardPadding, gap: space.lg },
    due: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  });
