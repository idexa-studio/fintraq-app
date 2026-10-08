import type { LoanType } from '@/data/repositories/loans';
import { AmountField, Button, Card, Chip, Dialog, Emblem, Header, IconCircle, ListGroup, ListRow, Message, Screen, Skeleton, SlideToConfirm, Text, TextField, useStyles, useTheme, useToast } from '@/design';
import type { Theme } from '@/design';
import { accountTypeIcon, useAccounts } from '@/features/accounts';
import { useAddRepayment, useLoanWithStats } from '@/features/loans/hooks/loans';
import { NOTE_MAX, repaymentAccounts, repaymentAmountOf, repaymentBlockerOf } from '@/features/loans/loan-rules';
import { useLeaveGuard } from '@/features/shell';
import { AccountPicker, WhenPicker, dayLabel } from '@/features/transactions';
import { getCurrencySymbol } from '@/shared/currency/currencies';
import { formatDate } from '@/shared/date/date';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * Recording money coming back, or going back. Sliding, not tapping, records
 * it: a repayment moves an account balance and may settle the loan.
 */
export function RepaymentScreen({ loanId }: { loanId: number }) {
  const { t } = useTranslation(['loans', 'common']);
  const { size, space } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();

  const { data: loan, isPending } = useLoanWithStats(loanId);
  const { data: allAccounts } = useAccounts();
  const add = useAddRepayment();

  const [amountText, setAmountText] = useState('');
  const [chosenAccount, setChosenAccount] = useState<number | null>(null);
  const [when, setWhen] = useState(() => new Date());
  const [note, setNote] = useState('');
  const [picker, setPicker] = useState<'account' | 'when' | null>(null);
  const [failed, setFailed] = useState(false);

  const accounts = useMemo(() => (loan ? repaymentAccounts(allAccounts ?? [], loan) : []), [allAccounts, loan]);
  const account = accounts.find((a) => a.id === chosenAccount) ?? accounts[0] ?? null;
  const guard = useLeaveGuard(!!amountText || !!note);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/plan'));
  const header = (title?: string) => <Header task title={title} onClose={close} closeLabel={t('close')} />;

  if (isPending || !allAccounts) {
    return (
      <Screen sheet header={header()}>
        <Skeleton height={size.row * 2} />
        <Skeleton height={size.row * 2} />
      </Screen>
    );
  }

  // A settled loan has nothing left to repay; reached by an old link, it says so.
  if (!loan || loan.computedStatus === 'repaid') {
    return (
      <Screen sheet scroll={false} header={header()}>
        <View style={styles.centre}>
          <Message illustration={<Emblem icon="hand-coins" color="pink" />} title={loan ? t('loan.settled') : t('loan.notFound')} />
        </View>
      </Screen>
    );
  }

  const type = loan.type as LoanType;
  const money = (amount: number) => formatCurrency(amount, loan.currency);
  const blocker = repaymentBlockerOf(amountText, loan.outstanding, account?.id ?? null);
  const amount = repaymentAmountOf(amountText);
  const blockedLine = blocker
    ? blocker === 'tooMuch'
      ? t('repay.blocked.tooMuch', { amount: money(loan.outstanding) })
      : blocker === 'account'
        ? t('repay.blocked.account', { currency: loan.currency })
        : t('repay.blocked.amount')
    : null;
  const whenText = `${dayLabel(when, t('common:today'), t('common:yesterday'))} · ${formatDate(when, { hour: 'numeric', minute: '2-digit' })}`;

  const record = async () => {
    if (blocker || !account) return;
    try {
      const result = await add.mutateAsync({ loanId: loan.id, loanType: type, personId: loan.personId ?? null, accountId: account.id, categoryId: loan.categoryId, amount, datetime: when.toISOString(), note: note.trim() });
      guard.release();
      toast.show({ message: result.isFullyRepaid ? (loan.personName ? t('repay.settledWith', { name: loan.personName }) : t('repay.settled')) : t('repay.recorded') });
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
      header={header(t('repay.title'))}
      footer={
        <>
          {blockedLine ? <Text variant="callout" tone="muted" align="center">{blockedLine}</Text> : null}
          {/* Keyed by the amount so the slider starts again whenever what it would record changes. */}
          <SlideToConfirm key={amountText} label={blocker ? t('repay.slideEmpty') : t('repay.slide', { amount: money(amount) })} onConfirm={record} disabled={!!blocker || add.isPending} />
        </>
      }
    >
      <Card style={{ gap: space.sm }}>
        <View style={styles.amountHead}>
          <Text variant="callout" tone="muted">{t('repay.amount')}</Text>
          <Text variant="callout" tone="muted">{t('repay.outstanding', { amount: money(loan.outstanding) })}</Text>
        </View>
        <AmountField value={amountText} onChangeText={setAmountText} symbol={getCurrencySymbol(loan.currency)} accessibilityLabel={t('repay.amount')} focusOnArrival />
        <View style={styles.all}>
          <Chip label={t('repay.all', { amount: money(loan.outstanding) })} selected={!blocker && Math.round(amount * 100) === Math.round(loan.outstanding * 100)} onPress={() => setAmountText(loan.outstanding.toFixed(2))} />
        </View>
      </Card>

      <View style={styles.block}>
        <Text variant="bodyStrong">{type === 'lend' ? t('repay.into') : t('repay.outOf')}</Text>
        <Card padded={false}>
          {account ? (
            <ListRow
              leading={<IconCircle icon={accountTypeIcon(account.accountType)} color={colorNumberToHex(account.color)} />}
              strong
              title={account.name}
              subtitle={formatCurrency(account.balance, account.currency)}
              onPress={accounts.length > 1 ? () => setPicker('account') : undefined}
            />
          ) : (
            <ListRow icon="warning" title={t('repay.blocked.account', { currency: loan.currency })} disabled />
          )}
        </Card>
      </View>

      <View style={styles.block}>
        <Text variant="bodyStrong">{t('repay.details')}</Text>
        <ListGroup>
          <View style={styles.fields}>
            <TextField label={t('repay.when')} value={whenText} onPress={() => setPicker('when')} />
            <TextField label={t('repay.note')} value={note} onChangeText={setNote} placeholder={t('repay.noteOptional')} maxLength={NOTE_MAX} remaining={(count) => t('common:charactersLeft', { count })} />
          </View>
        </ListGroup>
      </View>

      <AccountPicker title={type === 'lend' ? t('repay.into') : t('repay.outOf')} visible={picker === 'account'} onClose={() => setPicker(null)} accounts={accounts} selectedId={account?.id ?? null} onSelect={setChosenAccount} />
      <WhenPicker visible={picker === 'when'} onClose={() => setPicker(null)} value={when} onChange={setWhen} />

      <Dialog visible={guard.asking} onRequestClose={guard.stay} title={t('repay.discard.title')} body={t('repay.discard.body')}>
        <Button label={t('repay.discard.confirm')} variant="danger" onPress={guard.leave} />
        <Button label={t('repay.discard.cancel')} variant="secondary" onPress={guard.stay} />
      </Dialog>
      <Dialog visible={failed} onRequestClose={() => setFailed(false)} title={t('repay.saveFailed')} body={t('repay.saveFailedBody')}>
        <Button label={t('repay.ok')} onPress={() => setFailed(false)} />
      </Dialog>
    </Screen>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    centre: { flex: 1, justifyContent: 'center' },
    block: { gap: space.md },
    fields: { padding: size.cardPadding, gap: space.lg },
    amountHead: { flexDirection: 'row', justifyContent: 'space-between' },
    all: { flexDirection: 'row' },
  });
