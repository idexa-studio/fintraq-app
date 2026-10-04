import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, StyleSheet, View } from 'react-native';
import { Button, Chip, FormField, LIST_ITEM_LEADING_SIZE, ListGroup, ListItem, PersonAvatar, Screen, Text } from '@/src/components/ui';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import type { LoanWithStats } from '@/src/features/loans/api/loans';
import { useAddRepayment } from '@/src/features/loans/hooks/loans';
import { TransactionAccountPicker } from '@/src/features/transactions/components/TransactionAccountPicker';
import { TransactionAmountInput } from '@/src/features/transactions/components/TransactionAmountInput';
import type { AlertOptions } from '@/src/hooks/useAlertDialog';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { toErrorMessage } from '@/src/utils/errors';
import { colorNumberToHex, formatCurrency, formatDate, parseAmount } from '@/src/utils/format';

type Props = {
  loan: LoanWithStats;
  personName: string;
  visible: boolean;
  onClose: () => void;
  /** Called after a repayment that settles the loan, so reminders can be cancelled. */
  showAlert: (options: AlertOptions) => void;
};

/** Records one repayment. Owns its form; it resets each time it opens. */
export const RepaymentSheet = React.memo(function RepaymentSheet({ loan, personName, visible, onClose, showAlert }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: allAccounts = [] } = useAccounts();
  const addRepayment = useAddRepayment();

  const [amountInput, setAmountInput] = useState('');
  const [accountId, setAccountId] = useState<number | null>(null);
  const [date, setDate] = useState(() => new Date());
  const [note, setNote] = useState('');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const accounts = useMemo(() => allAccounts.filter((a) => a.currency === loan.currency), [allAccounts, loan.currency]);
  const effectiveAccountId = accountId ?? accounts.find((a) => a.id === loan.accountId)?.id ?? accounts[0]?.id ?? null;
  const amount = parseAmount(amountInput);
  const outstandingLabel = formatCurrency(loan.outstanding, loan.currency);
  const isOver = amount > loan.outstanding;
  const canSubmit = amount > 0 && !isOver && effectiveAccountId !== null && !addRepayment.isPending;

  const reset = useCallback(() => {
    setAmountInput('');
    setAccountId(null);
    setDate(new Date());
    setNote('');
  }, []);

  const submit = useCallback(async () => {
    if (!canSubmit || effectiveAccountId === null) return;
    try {
      const result = await addRepayment.mutateAsync({
        loanId: loan.id,
        loanType: loan.type as 'lend' | 'borrow',
        personId: loan.personId ?? null,
        accountId: effectiveAccountId,
        categoryId: loan.categoryId,
        amount,
        datetime: date.toISOString(),
        note: note.trim(),
      });
      onClose();
      reset();
      // Reminders for a settled loan are dropped by the sync that follows every ledger write.
      if (result.isFullyRepaid) {
        showAlert({ title: t('loans.fullyRepaid'), message: t('loans.settledMessage', { name: loan.personName ?? t('loans.thisLoan') }), type: 'success' });
      }
    } catch (e) {
      showAlert({ title: t('loans.error'), message: toErrorMessage(e, t('loans.repayFailed')), type: 'error' });
    }
  }, [canSubmit, effectiveAccountId, addRepayment, loan, amount, date, note, onClose, reset, showAlert, t]);

  const onDateChange = useCallback((_: DateTimePickerEvent, next?: Date) => {
    setDatePickerVisible(false);
    if (next) setDate(next);
  }, []);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <Screen
        header={{ title: t('loans.recordRepayment'), showBack: true, onBack: onClose }}
        edgeToEdge
        keyboardAvoiding
        footer={<Button title={t('loans.recordRepayment')} onPress={submit} disabled={!canSubmit} isLoading={addRepayment.isPending} size="lg" fullWidth />}
      >
        {loan.personId != null ? (
          <View style={styles.padded}>
            <ListGroup>
              <ListItem
                leading={
                  <PersonAvatar
                    name={personName}
                    color={loan.personColor != null ? colorNumberToHex(loan.personColor) : colors.textMuted}
                    size={LIST_ITEM_LEADING_SIZE}
                  />
                }
                title={personName}
                subtitle={t('loans.outstandingAmount', { amount: outstandingLabel })}
              />
            </ListGroup>
          </View>
        ) : null}

        <View style={styles.amount}>
          <TransactionAmountInput value={amountInput} onChange={setAmountInput} currency={loan.currency} />
          <View style={[styles.padded, styles.amountMeta]}>
            {isOver ? (
              <Text variant="caption" tone="danger">
                {t('loans.exceedsOutstanding', { amount: outstandingLabel })}
              </Text>
            ) : null}
            {loan.outstanding > 0 ? (
              <Chip label={t('loans.fullAmount', { amount: outstandingLabel })} onPress={() => setAmountInput(loan.outstanding.toFixed(2))} />
            ) : null}
          </View>
        </View>

        <TransactionAccountPicker
          accounts={accounts}
          selectedId={effectiveAccountId}
          onSelect={setAccountId}
          label={loan.type === 'lend' ? t('loans.receivedInto') : t('loans.sentFrom')}
        />

        <View style={styles.padded}>
          <ListGroup>
            <ListItem
              icon="calendar-blank"
              iconColor={colors.primaryInk}
              title={t('loans.date')}
              value={formatDate(date, { day: 'numeric', month: 'short', year: 'numeric' })}
              onPress={() => setDatePickerVisible(true)}
            />
          </ListGroup>
        </View>

        <View style={styles.padded}>
          <ListGroup insetDividers={false}>
            <FormField label={t('loans.note')} value={note} onChangeText={setNote} placeholder={t('loans.optionalNote')} multiline maxLength={200} />
          </ListGroup>
        </View>

        {isDatePickerVisible ? (
          <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onDateChange} />
        ) : null}
      </Screen>
    </Modal>
  );
});

const createStyles = ({ spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    padded: { paddingHorizontal: layout.screenPadding },
    amount: { gap: spacing('1') },
    amountMeta: { gap: spacing('2'), alignItems: 'flex-start' },
  });
