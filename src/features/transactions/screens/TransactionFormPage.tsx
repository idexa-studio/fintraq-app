import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { AlertDialog, Button, FormField, ListGroup, ListItem, PersonAvatar, Screen, Skeleton, SkeletonRow, Text } from '@/src/components/ui';
import { CalendarBlankIcon, ClockIcon, UserCircleIcon } from '@/src/components/ui/icons';
import { useSettings } from '@/src/providers/SettingsProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { useCategories } from '@/src/features/categories/hooks/categories';
import { TransactionAccountPicker } from '@/src/features/transactions/components/TransactionAccountPicker';
import { TransactionAmountInput } from '@/src/features/transactions/components/TransactionAmountInput';
import { TransactionCategoryPicker } from '@/src/features/transactions/components/TransactionCategoryPicker';
import { PersonPickerBottomSheet } from '@/src/features/persons/components/PersonPickerBottomSheet';
import { TransactionTypePicker } from '@/src/features/transactions/components/TransactionTypePicker';
import { usePersons } from '@/src/features/persons/hooks/persons';
import { useCreateTransaction, useTransactionById, useUpdateTransaction } from '@/src/features/transactions/hooks/transactions';
import { useLoanWithStats } from '@/src/features/loans/hooks/loans';
import { colorNumberToHex, formatDate } from '@/src/utils/format';
import { format } from 'date-fns';
import { TransactionType } from '@/src/types';
import { AnalyticsService } from '@/src/services/analytics';
import { isTransferCompatible } from '@/src/utils/accounts';
import type { AccountType } from '@/src/types';
import { useTranslation } from 'react-i18next';
import { useAlertDialog } from '@/src/hooks/useAlertDialog';

type Props = {
  mode: 'create' | 'edit';
  transactionId?: number | null;
  /** Starting type for a new entry (quick actions open the form pre-set). Ignored when editing. */
  initialType?: TransactionType;
  /** Starting account for a new entry (e.g. opened from an account's screen). Ignored when editing. */
  initialAccountId?: number;
};

const parseAmount = (raw: string): number => {
  const normalized = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const TransactionFormPage = React.memo(function TransactionFormPage({ mode, transactionId, initialType = 'DR', initialAccountId }: Props) {
  const router = useRouter();
  const isEditMode = mode === 'edit';

  const theme = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;
  const { profile } = useSettings();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { showAlert, alertProps } = useAlertDialog();

  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const personsQuery = usePersons();
  const transactionByIdQuery = useTransactionById(isEditMode ? transactionId ?? null : null);
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const accounts = React.useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const categories = React.useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const persons = React.useMemo(() => personsQuery.data ?? [], [personsQuery.data]);
  const editingTransaction = React.useMemo(() => {
    if (!isEditMode) return null;
    return transactionByIdQuery.data ?? null;
  }, [transactionByIdQuery.data, isEditMode]);

  const isRepayment = isEditMode && !!editingTransaction && editingTransaction.loanId !== null;
  const { data: loan } = useLoanWithStats(isRepayment && editingTransaction ? editingTransaction.loanId : null);

  const [type, setType] = React.useState<TransactionType>(initialType);
  const [selectedAccountId, setSelectedAccountId] = React.useState<number | null>(null);
  const [toAccountId, setToAccountId] = React.useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
  const [transactionDateTime, setTransactionDateTime] = React.useState<Date>(() => new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [selectedPersonId, setSelectedPersonId] = React.useState<number | null>(null);
  const [showPersonPicker, setShowPersonPicker] = React.useState(false);
  const [amountInput, setAmountInput] = React.useState('');
  const [note, setNote] = React.useState('');

  React.useEffect(() => {
    if (!isEditMode || !editingTransaction) return;
    setType(editingTransaction.type);
    setSelectedAccountId(editingTransaction.accountId);
    setToAccountId(editingTransaction.toAccountId ?? null);
    setSelectedPersonId(editingTransaction.personId ?? null);
    setSelectedCategoryId(editingTransaction.categoryId);
    setTransactionDateTime(new Date(editingTransaction.datetime));
    setAmountInput(String(editingTransaction.amount));
    setNote(editingTransaction.note ?? '');
  }, [isEditMode, editingTransaction]);

  const filteredCategories = React.useMemo(
    () => categories.filter((c) => c.type.split(',').includes(type)),
    [categories, type],
  );

  // When type changes, clear toAccountId so stale selection doesn't persist
  const handleTypeChange = React.useCallback(
    (next: TransactionType) => {
      setType(next);
      setToAccountId(null);
    },
    [],
  );

  React.useEffect(() => {
    if (accounts.length === 0) {
      setSelectedAccountId(null);
      return;
    }
    if (
      selectedAccountId === null ||
      !accounts.some((a) => a.id === selectedAccountId)
    ) {
      const preferred = accounts.find((a) => a.id === initialAccountId) ?? accounts.find((a) => a.isDefault) ?? accounts[0];
      setSelectedAccountId(preferred.id);
    }
  }, [accounts, selectedAccountId, initialAccountId]);

  React.useEffect(() => {
    if (filteredCategories.length === 0) {
      setSelectedCategoryId(null);
      return;
    }
    if (
      selectedCategoryId === null ||
      !filteredCategories.some((c) => c.id === selectedCategoryId)
    ) {
      // First real category, not the system "Others" catch-all.
      setSelectedCategoryId((filteredCategories.find((c) => !c.isSystem) ?? filteredCategories[0]).id);
    }
  }, [filteredCategories, selectedCategoryId]);

  const amountValue = React.useMemo(() => parseAmount(amountInput), [amountInput]);

  const selectedAccount = React.useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  );

  const selectedCategory = React.useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  // TO account options: same currency + type-compatible transfer, excluding FROM itself
  const toAccountOptions = React.useMemo(() => {
    if (type !== 'TR' || !selectedAccount) return [];
    const fromType = selectedAccount.accountType as AccountType | null;
    return accounts.filter(
      (a) =>
        a.id !== selectedAccountId &&
        a.currency === selectedAccount.currency &&
        isTransferCompatible(fromType, a.accountType as AccountType | null),
    );
  }, [type, accounts, selectedAccountId, selectedAccount]);

  // Auto-clear toAccountId if it's no longer a valid option
  React.useEffect(() => {
    if (type !== 'TR') return;
    if (toAccountId != null && !toAccountOptions.some((a) => a.id === toAccountId)) {
      setToAccountId(null);
    }
  }, [type, toAccountOptions, toAccountId]);

  const formattedDate = React.useMemo(
    () => formatDate(transactionDateTime, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    [transactionDateTime],
  );

  const formattedTime = React.useMemo(
    () => format(transactionDateTime, 'HH:mm'),
    [transactionDateTime],
  );

  const onDatePicked = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && picked) {
      setTransactionDateTime((curr) => {
        const next = new Date(curr);
        next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
        return next;
      });
    }
  };

  const onTimePicked = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'set' && picked) {
      setTransactionDateTime((curr) => {
        const next = new Date(curr);
        next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
        return next;
      });
    }
  };

  const isSubmitting = createTransaction.isPending || updateTransaction.isPending;

  const canSubmit = React.useMemo(() => {
    if (amountValue <= 0 || !selectedAccountId || !selectedCategoryId || isSubmitting) return false;
    if (type === 'TR') return !!toAccountId && toAccountId !== selectedAccountId;
    return true;
  }, [amountValue, selectedAccountId, selectedCategoryId, isSubmitting, type, toAccountId]);

  const handleSave = async () => {
    if (!selectedAccountId || !selectedCategoryId || amountValue <= 0) {
      showAlert({ title: t('transactions.missingDetails'), message: t('transactions.missingDetailsMessage'), type: 'warning' });
      return;
    }
    if (type === 'TR' && !toAccountId) {
      showAlert({ title: t('transactions.missingDestination'), message: t('transactions.missingDestinationMessage'), type: 'warning' });
      return;
    }

    if (isRepayment && loan && editingTransaction) {
      const maxAllowed = loan.outstanding + editingTransaction.amount;
      if (amountValue > maxAllowed) {
        showAlert({ title: t('transactions.repaymentExceeds'), message: t('transactions.repaymentExceedsMessage', { currency: loan.currency, max: maxAllowed.toFixed(2), outstanding: loan.outstanding.toFixed(2), current: editingTransaction.amount.toFixed(2) }), type: 'warning' });
        return;
      }
    }

    const payload = {
      accountId: selectedAccountId,
      categoryId: selectedCategoryId,
      toAccountId: type === 'TR' ? toAccountId : null,
      personId: selectedPersonId,
      amount: amountValue,
      type,
      datetime: transactionDateTime.toISOString(),
      note: note.trim() || selectedCategory?.name || t('transactions.defaultNote'),
    };

    try {
      if (isEditMode && editingTransaction) {
        await updateTransaction.mutateAsync({ id: editingTransaction.id, data: payload });
      } else {
        await createTransaction.mutateAsync(payload);
      }
      await AnalyticsService.transactionSaved(
        isEditMode ? 'edit' : 'create',
        type,
        amountValue,
        selectedAccount?.currency ?? profile.defaultCurrency,
        Boolean(note.trim()),
        selectedPersonId != null
      );
      router.back();
    } catch {
      showAlert({ title: t('transactions.unableToSave'), message: t('transactions.unableToSaveMessage'), type: 'error' });
    }
  };

  if (
    (accountsQuery.isLoading || categoriesQuery.isLoading || transactionByIdQuery.isLoading) &&
    isEditMode
  ) {
    return (
      <Screen header={{ title: t('transactions.editEntry'), showBack: true }}>
        <Skeleton height={44} radius="md" />
        <Skeleton height={110} radius="xl" />
        <ListGroup>
          <SkeletonRow />
          <SkeletonRow />
        </ListGroup>
      </Screen>
    );
  }

  const personName = selectedPersonId
    ? (persons.find((p) => p.id === selectedPersonId)?.name ?? t('transactions.unknown'))
    : t('transactions.none');

  return (
    <Screen
      header={{ title: isEditMode ? t('transactions.editEntry') : t('transactions.newEntry'), showBack: true }}
      edgeToEdge
      keyboardAvoiding
      footer={
        <Button
          title={isEditMode ? t('transactions.saveChanges') : t('transactions.saveTransaction')}
          onPress={handleSave}
          disabled={!canSubmit}
          isLoading={isSubmitting}
          size="lg"
          fullWidth
        />
      }
      overlays={
        <>
          <PersonPickerBottomSheet
            visible={showPersonPicker}
            onClose={() => setShowPersonPicker(false)}
            persons={persons}
            selectedId={selectedPersonId}
            onSelect={setSelectedPersonId}
          />
          <AlertDialog {...alertProps} />
        </>
      }
    >
      <View style={styles.top}>
        {!isRepayment && (
          <TransactionTypePicker value={type} onChange={handleTypeChange} disabled={isEditMode} />
        )}
        <TransactionAmountInput
          value={amountInput}
          onChange={setAmountInput}
          currency={selectedAccount?.currency ?? profile.defaultCurrency}
        />
      </View>

      {isRepayment ? (
        <View style={styles.padded}>
          <ListGroup>
            <ListItem
              leading={loan?.personName ? <PersonAvatar name={loan.personName} color={colorNumberToHex(loan.personColor ?? 0)} size={36} /> : undefined}
              title={loan == null ? t('transactions.loading') : (loan.personName ?? loan.accountName)}
              subtitle={t('transactions.loanRepaymentFor')}
            />
          </ListGroup>
        </View>
      ) : null}

      <TransactionAccountPicker
        label={type === 'TR' ? t('transactions.fromAccount') : t('transactions.account')}
        accounts={accounts}
        selectedId={selectedAccountId}
        onSelect={setSelectedAccountId}
      />

      {type === 'TR' ? (
        toAccountOptions.length > 0 ? (
          <TransactionAccountPicker
            label={t('transactions.toAccount')}
            accounts={toAccountOptions}
            selectedId={toAccountId}
            onSelect={setToAccountId}
          />
        ) : (
          <View style={styles.padded}>
            <Text variant="label" tone="muted" style={styles.label}>{t('transactions.toAccount')}</Text>
            <Text variant="callout" tone="warning" style={styles.label}>{t('transactions.noCompatible')}</Text>
          </View>
        )
      ) : null}

      {!isRepayment ? (
        <TransactionCategoryPicker
          categories={filteredCategories}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />
      ) : null}

      <View style={styles.padded}>
        <ListGroup>
          {!isRepayment && persons.length > 0 && type !== 'TR' ? (
            <ListItem
              icon={UserCircleIcon}
              iconColor={colors.info}
              title={t('transactions.linkedPerson')}
              value={personName}
              onPress={() => setShowPersonPicker(true)}
            />
          ) : null}
          <ListItem
            icon={CalendarBlankIcon}
            iconColor={colors.primaryInk}
            title={t('transactions.date')}
            value={formattedDate}
            onPress={() => setShowDatePicker(true)}
          />
          <ListItem
            icon={ClockIcon}
            iconColor={colors.primaryInk}
            title={t('transactions.time')}
            value={formattedTime}
            onPress={() => setShowTimePicker(true)}
          />
        </ListGroup>
      </View>

      <View style={styles.padded}>
        <ListGroup insetDividers={false}>
          <FormField
            label={t('transactions.note')}
            value={note}
            onChangeText={setNote}
            placeholder={t('transactions.optionalContext')}
            multiline
            maxLength={200}
          />
        </ListGroup>
      </View>

      {showDatePicker ? (
        <DateTimePicker value={transactionDateTime} mode="date" display="default" onChange={onDatePicked} />
      ) : null}
      {showTimePicker ? (
        <DateTimePicker value={transactionDateTime} mode="time" display="default" onChange={onTimePicked} />
      ) : null}
    </Screen>
  );
});

const createStyles = ({ spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    top: { gap: spacing('1') },
    padded: { paddingHorizontal: layout.screenPadding, gap: spacing('2') },
    label: { marginLeft: spacing('1') },
  });
