import { Calendar03Icon, Clock01Icon, PencilEdit01Icon, UnfoldMoreIcon, UserCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BentoPressable } from '../../../components/ui/BentoPressable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageBackground } from '../../../components/ui/PageBackground';
import { Header } from '../../../components/ui/Header';
import { useSettings } from '../../../providers/SettingsProvider';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useCategories } from '../../categories/hooks/categories';
import { TransactionAccountPicker } from '../components/TransactionAccountPicker';
import { TransactionAmountInput } from '../components/TransactionAmountInput';
import { TransactionCategoryPicker } from '../components/TransactionCategoryPicker';
import { PersonPickerBottomSheet } from '../../persons/components/PersonPickerBottomSheet';
import { TransactionTypePicker } from '../components/TransactionTypePicker';
import { usePersons } from '../../persons/hooks/persons';
import {
  useCreateTransaction,
  useTransactionById,
  useUpdateTransaction,
} from '../hooks/transactions';
import { format } from 'date-fns';
import { TransactionType } from '../../../types';
import { WalkthroughOverlay, TRANSACTION_WALKTHROUGH_STEPS } from '@/src/features/walkthrough';
import { AnalyticsService } from '@/src/services/analytics';
import { StorageKeys } from '../../../constants/keys';

type Props = {
  mode: 'create' | 'edit';
  transactionId?: number | null;
};

const parseAmount = (raw: string): number => {
  const normalized = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const TransactionFormPage = React.memo(function TransactionFormPage({ mode, transactionId }: Props) {
  const router = useRouter();
  const isEditMode = mode === 'edit';

  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

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

  const [type, setType] = React.useState<TransactionType>('DR');
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
    () => categories.filter((c) => c.type === type),
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
      const preferred = accounts.find((a) => a.isDefault) ?? accounts[0];
      setSelectedAccountId(preferred.id);
    }
  }, [accounts, selectedAccountId]);

  React.useEffect(() => {
    if (filteredCategories.length === 0) {
      setSelectedCategoryId(null);
      return;
    }
    if (
      selectedCategoryId === null ||
      !filteredCategories.some((c) => c.id === selectedCategoryId)
    ) {
      setSelectedCategoryId(filteredCategories[0].id);
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

  // TO account options: same currency as FROM, excluding FROM itself
  const toAccountOptions = React.useMemo(() => {
    if (type !== 'TR' || !selectedAccount) return [];
    return accounts.filter(
      (a) => a.id !== selectedAccountId && a.currency === selectedAccount.currency,
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
    () => format(transactionDateTime, 'EEE, d MMM yyyy'),
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
      Alert.alert('Missing details', 'Please select account, category, and a valid amount.');
      return;
    }
    if (type === 'TR' && !toAccountId) {
      Alert.alert('Missing destination', 'Please select a destination account for the transfer.');
      return;
    }

    const payload = {
      accountId: selectedAccountId,
      categoryId: selectedCategoryId,
      toAccountId: type === 'TR' ? toAccountId : null,
      personId: selectedPersonId,
      amount: amountValue,
      type,
      datetime: transactionDateTime.toISOString(),
      note: note.trim() || selectedCategory?.name || 'Transaction',
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
      Alert.alert('Unable to save', 'Could not save transaction. Please try again.');
    }
  };

  if (
    (accountsQuery.isLoading || categoriesQuery.isLoading || transactionByIdQuery.isLoading) &&
    isEditMode
  ) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />
      <Header title={isEditMode ? 'Edit entry' : 'New entry'} showBack />

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TransactionTypePicker value={type} onChange={handleTypeChange} disabled={isEditMode} />

        <TransactionAmountInput
          value={amountInput}
          onChange={setAmountInput}
          currency={selectedAccount?.currency ?? profile.defaultCurrency}
        />

        <View style={styles.formBody}>
          <TransactionAccountPicker
            label="From account"
            accounts={accounts}
            selectedId={selectedAccountId}
            onSelect={setSelectedAccountId}
          />

          {type === 'TR' && (
            <>
              {toAccountOptions.length > 0 ? (
                <TransactionAccountPicker
                  label="To account"
                  accounts={toAccountOptions}
                  selectedId={toAccountId}
                  onSelect={setToAccountId}
                />
              ) : (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>To account</Text>
                  <Text style={styles.transferHint}>
                    No other accounts with the same currency.
                  </Text>
                </View>
              )}
            </>
          )}

          <TransactionCategoryPicker
            categories={filteredCategories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />

          {persons.length > 0 && type !== 'TR' && (
            <View style={styles.section}>
              <BentoPressable
                style={styles.personBtn}
                onPress={() => setShowPersonPicker(true)}
              >
                <View style={styles.iconContainer}>
                  <HugeiconsIcon icon={UserCircleIcon} size={18} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.triggerLabel}>Linked person</Text>
                  <Text
                    style={[
                      styles.dateTimeText,
                      !selectedPersonId && { color: colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedPersonId
                      ? (persons.find((p) => p.id === selectedPersonId)?.name ?? 'Unknown')
                      : 'No person linked'}
                  </Text>
                </View>
                <HugeiconsIcon icon={UnfoldMoreIcon} size={16} color={colors.textMuted} />
              </BentoPressable>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.dateTimeRow}>
              <BentoPressable
                style={styles.dateTimeBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.iconContainer}>
                  <HugeiconsIcon icon={Calendar03Icon} size={18} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.triggerLabel}>Date</Text>
                  <Text style={styles.dateTimeText} numberOfLines={1}>{formattedDate}</Text>
                </View>
              </BentoPressable>

              <BentoPressable
                style={styles.dateTimeBtn}
                onPress={() => setShowTimePicker(true)}
              >
                <View style={styles.iconContainer}>
                  <HugeiconsIcon icon={Clock01Icon} size={18} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.triggerLabel}>Time</Text>
                  <Text style={styles.dateTimeText} numberOfLines={1}>{formattedTime}</Text>
                </View>
              </BentoPressable>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={transactionDateTime}
              mode="date"
              display="default"
              onChange={onDatePicked}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={transactionDateTime}
              mode="time"
              display="default"
              onChange={onTimePicked}
            />
          )}

          <View style={styles.section}>
            <View style={styles.noteContainer}>
              <View style={styles.noteHeader}>
                <View style={styles.noteIconContainer}>
                  <HugeiconsIcon icon={PencilEdit01Icon} size={16} color={colors.primary} />
                </View>
                <Text style={styles.noteLabel}>Note</Text>
              </View>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Optional context"
                placeholderTextColor={colors.textMuted + '80'}
                multiline
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <BentoPressable
          style={[styles.saveBtn, !canSubmit && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.saveBtnText}>
              {isEditMode ? 'Save changes' : 'Save transaction'}
            </Text>
          )}
        </BentoPressable>
      </View>
      </KeyboardAvoidingView>

      <PersonPickerBottomSheet
        visible={showPersonPicker}
        onClose={() => setShowPersonPicker(false)}
        persons={persons}
        selectedId={selectedPersonId}
        onSelect={setSelectedPersonId}
      />

      {mode === 'create' && (
        <WalkthroughOverlay storageKey={StorageKeys.WALKTHROUGH_TRANSACTION_CREATE} steps={TRANSACTION_WALKTHROUGH_STEPS} />
      )}
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout, sizes }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    body: {
      flex: 1,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    content: {
      paddingBottom: spacing('6'),
    },
    formBody: {
      gap: spacing('4'),
    },
    section: {
      paddingHorizontal: layout.screenPadding,
      gap: spacing('3'),
    },
    sectionLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    transferHint: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },
    dateTimeRow: {
      flexDirection: 'row',
      gap: spacing('3'),
    },
    dateTimeBtn: {
      flex: 1,
      height: sizes.input.md.height,
      borderRadius: sizes.input.md.borderRadius,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('3'),
      gap: spacing('2.5'),
    },
    dateTimeText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 13,
      color: colors.text,
    },
    personBtn: {
      height: sizes.input.md.height,
      borderRadius: sizes.input.md.borderRadius,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('3'),
      gap: spacing('2.5'),
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary + '10',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    triggerLabel: {
      fontFamily: typography.fonts.medium,
      fontSize: 10,
      color: colors.textMuted,
      marginBottom: Platform.OS === 'ios' ? 1 : 0,
    },
    noteContainer: {
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      padding: sizes.card.md.padding,
    },
    noteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2.5'),
      marginBottom: spacing('2'),
    },
    noteIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary + '10',
      alignItems: 'center',
      justifyContent: 'center',
    },
    noteLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 13,
      color: colors.text,
    },
    noteInput: {
      fontFamily: typography.fonts.regular,
      fontSize: 14,
      color: colors.text,
      textAlignVertical: 'top',
      minHeight: 80,
      padding: 0,
    },
    footer: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: spacing('0'),
    },
    saveBtn: {
      height: 52,
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnDisabled: {
      opacity: 0.5,
    },
    saveBtnText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 16,
      color: colors.primaryForeground,
    },
  });
