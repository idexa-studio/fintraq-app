import { useProAccess } from '@/src/features/premium/hooks/useProAccess';
import { Screen } from '@/src/components/ui/Screen';
import { Banner, Button, FormField, IconButton, LIST_ITEM_LEADING_SIZE, ListGroup, ListItem, SegmentedControl } from '@/src/components/ui';
import { CalendarBlankIcon, XIcon } from '@/src/components/ui/icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { PersonAvatar } from '@/src/components/ui/PersonAvatar';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { PersonPickerBottomSheet } from '@/src/features/persons/components/PersonPickerBottomSheet';
import { usePersons } from '@/src/features/persons/hooks/persons';
import { TransactionAccountPicker } from '@/src/features/transactions/components/TransactionAccountPicker';
import { TransactionAmountInput } from '@/src/features/transactions/components/TransactionAmountInput';
import { usePremium } from '@/src/providers/PremiumProvider';
import { FREE_LOAN_LIMIT } from '@/src/constants/iap';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex, formatDate } from '@/src/utils/format';
import { toErrorMessage } from '@/src/utils/errors';
import { useCreateLoan, useLoansCount } from '@/src/features/loans/hooks/loans';
import { Coins02Icon, HandshakeIcon, Money01Icon } from '@hugeicons/core-free-icons';
import { useTranslation } from 'react-i18next';


const parseAmount = (raw: string) => {
  const n = parseFloat(raw.replace(',', '.').replace(/[^0-9.]/g, ''));
  return isFinite(n) ? n : 0;
};

export const LoanFormScreen = React.memo(function LoanFormScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { showAlert } = usePremium();
  const { isPremium, openPaywall } = useProAccess();

  const { data: allAccounts } = useAccounts();
  const { data: allPersons } = usePersons();
  const { data: activeLoansCount } = useLoansCount();
  const createLoan = useCreateLoan();

  const { personId: prePersonId, type: preType } = useLocalSearchParams<{ personId?: string; type?: 'lend' | 'borrow' }>();

  const accounts = useMemo(() => allAccounts ?? [], [allAccounts]);
  const persons = useMemo(() => allPersons ?? [], [allPersons]);

  const [loanType, setLoanType] = useState<'lend' | 'borrow'>(
    preType === 'borrow' ? 'borrow' : 'lend',
  );
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(
    prePersonId ? Number(prePersonId) : null,
  );
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showPersonPicker, setShowPersonPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAccount = useMemo(
    () => accounts.find(a => a.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  );

  const selectedPerson = useMemo(
    () => persons.find(p => p.id === selectedPersonId) ?? null,
    [persons, selectedPersonId],
  );

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      const def = accounts.find(a => a.isDefault) ?? accounts[0];
      setSelectedAccountId(def.id);
    }
  }, [accounts, selectedAccountId]);

  const handleDueDateChange = useCallback((_: DateTimePickerEvent, date?: Date) => {
    setShowDueDatePicker(false);
    if (date) setDueDate(date);
  }, []);

  const atFreeLimit = !isPremium && (activeLoansCount ?? 0) >= FREE_LOAN_LIMIT;

  const personRequired = loanType === 'lend';
  const canSubmit = (!personRequired || selectedPersonId !== null) && selectedAccountId !== null && parseAmount(amountInput) > 0;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;

    if (atFreeLimit) {
      openPaywall('unlimited');
      return;
    }

    const amount = parseAmount(amountInput);
    const account = accounts.find(a => a.id === selectedAccountId);
    if (!account) return;

    setIsSubmitting(true);
    try {
      await createLoan.mutateAsync({
        data: {
          personId: selectedPersonId ?? undefined,
          type: loanType,
          principal: amount,
          currency: account.currency,
          accountId: selectedAccountId!,
          dueDate: dueDate ? dueDate.toISOString().slice(0, 10) : undefined,
          note: note.trim(),
        },
        txPayload: {
          note: note.trim(),
          datetime: new Date().toISOString(),
        },
      });
      router.back();
    } catch (e) {
      showAlert({
        title: t('loans.error'),
        message: toErrorMessage(e, t('loans.createFailed')),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, isSubmitting, atFreeLimit, amountInput, accounts, selectedAccountId, selectedPersonId, loanType, dueDate, note, createLoan, router, showAlert, t, openPaywall]);

  const clearButton = (onPress: () => void) => (
    <IconButton icon={XIcon} size="sm" variant="ghost" onPress={onPress} accessibilityLabel={t('loans.clear')} />
  );

  return (
    <Screen
      header={{ title: t('loans.newLoan'), showBack: true }}
      edgeToEdge
      keyboardAvoiding
      footer={
        <Button
          title={t('loans.createLoan')}
          onPress={handleSubmit}
          disabled={!canSubmit}
          isLoading={isSubmitting}
          size="lg"
          fullWidth
        />
      }
      overlays={
        <PersonPickerBottomSheet
          visible={showPersonPicker}
          onClose={() => setShowPersonPicker(false)}
          onSelect={(id) => { setSelectedPersonId(id); setShowPersonPicker(false); }}
          selectedId={selectedPersonId}
          persons={persons}
        />
      }
    >
      <View style={styles.top}>
        <View style={styles.padded}>
          <SegmentedControl
            options={[
              { value: 'lend', label: t('loans.iLent'), icon: Money01Icon },
              { value: 'borrow', label: t('loans.iBorrowed'), icon: Coins02Icon },
            ]}
            value={loanType}
            onChange={setLoanType}
          />
        </View>
        <TransactionAmountInput
          value={amountInput}
          onChange={setAmountInput}
          currency={selectedAccount?.currency ?? ''}
        />
      </View>

      <TransactionAccountPicker
        accounts={accounts}
        selectedId={selectedAccountId}
        onSelect={setSelectedAccountId}
        label={loanType === 'lend' ? t('loans.fromAccount') : t('loans.intoAccount')}
      />

      <View style={styles.padded}>
        <ListGroup>
          <ListItem
            leading={selectedPerson
              ? <PersonAvatar name={selectedPerson.name} color={colorNumberToHex(selectedPerson.color)} size={LIST_ITEM_LEADING_SIZE} />
              : <IconAvatar icon={HandshakeIcon} color={colors.primaryInk} variant="subtle" size={LIST_ITEM_LEADING_SIZE} />}
            title={loanType === 'lend' ? t('loans.lentTo') : t('loans.borrowedFrom')}
            value={selectedPerson?.name ?? (loanType === 'lend' ? t('loans.selectContact') : t('loans.selectContactOptional'))}
            onPress={() => setShowPersonPicker(true)}
            trailing={selectedPerson ? clearButton(() => setSelectedPersonId(null)) : undefined}
          />
          <ListItem
            icon={CalendarBlankIcon}
            iconColor={colors.primaryInk}
            title={t('loans.optionalDueDate')}
            value={dueDate ? formatDate(dueDate, { day: 'numeric', month: 'short', year: 'numeric' }) : t('loans.noDueDate')}
            onPress={() => setShowDueDatePicker(true)}
            trailing={dueDate ? clearButton(() => setDueDate(null)) : undefined}
          />
        </ListGroup>
      </View>

      <View style={styles.padded}>
        <ListGroup insetDividers={false}>
          <FormField
            label={t('loans.note')}
            value={note}
            onChangeText={setNote}
            placeholder={t('loans.whatsThisFor')}
            multiline
            maxLength={200}
          />
        </ListGroup>
      </View>

      {atFreeLimit ? (
        <View style={styles.padded}>
          <Banner
            tone="warning"
            title={t('loans.freeLimit', { limit: FREE_LOAN_LIMIT })}
            actionLabel={t('loans.upgrade')}
            onAction={() => openPaywall('unlimited')}
          />
        </View>
      ) : null}

      {showDueDatePicker ? (
        <DateTimePicker
          value={dueDate ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={handleDueDateChange}
        />
      ) : null}
    </Screen>
  );
});

const createStyles = ({ spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    top: { gap: spacing('1') },
    padded: { paddingHorizontal: layout.screenPadding },
  });
