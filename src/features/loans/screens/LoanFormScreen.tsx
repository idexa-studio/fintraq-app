import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BentoPressable } from '../../../components/ui/BentoPressable';
import { Header } from '../../../components/ui/Header';
import { MoneyText } from '../../../components/ui/MoneyText';
import { PageBackground } from '../../../components/ui/PageBackground';
import { PersonAvatar } from '../../../components/ui/PersonAvatar';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useCategories } from '../../categories/hooks/categories';
import { PersonPickerBottomSheet } from '../../persons/components/PersonPickerBottomSheet';
import { usePersons } from '../../persons/hooks/persons';
import { TransactionAccountPicker } from '../../transactions/components/TransactionAccountPicker';
import { TransactionCategoryPicker } from '../../transactions/components/TransactionCategoryPicker';
import { usePremium } from '../../../providers/PremiumProvider';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { colorNumberToHex } from '../../../utils/format';
import { toErrorMessage } from '../../../utils/errors';
import { useCreateLoan, useLoansCount } from '../hooks/loans';
import {
  Calendar03Icon,
  Coins01Icon,
  HandshakeIcon,
  Money01Icon,
  UnfoldMoreIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

const FREE_LOAN_LIMIT = 3;
const parseAmount = (raw: string) => {
  const n = parseFloat(raw.replace(',', '.').replace(/[^0-9.]/g, ''));
  return isFinite(n) ? n : 0;
};

export const LoanFormScreen = React.memo(function LoanFormScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isPremium } = usePremium();

  const { data: allAccounts } = useAccounts();
  const { data: allCategories } = useCategories();
  const { data: allPersons } = usePersons();
  const { data: activeLoansCount } = useLoansCount();
  const createLoan = useCreateLoan();

  const { personId: prePersonId } = useLocalSearchParams<{ personId?: string }>();

  const accounts = useMemo(() => allAccounts ?? [], [allAccounts]);
  const persons = useMemo(() => allPersons ?? [], [allPersons]);

  const [loanType, setLoanType] = useState<'lend' | 'borrow'>('lend');
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(
    prePersonId ? Number(prePersonId) : null,
  );
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showPersonPicker, setShowPersonPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const noteRef = useRef<TextInput>(null);

  const selectedAccount = useMemo(
    () => accounts.find(a => a.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  );

  const selectedPerson = useMemo(
    () => persons.find(p => p.id === selectedPersonId) ?? null,
    [persons, selectedPersonId],
  );

  const filteredCategories = useMemo(() => {
    if (!allCategories) return [];
    return allCategories.filter(c => c.type === 'DR' || c.type === 'CR');
  }, [allCategories]);

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      const def = accounts.find(a => a.isDefault) ?? accounts[0];
      setSelectedAccountId(def.id);
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (!selectedCategoryId && filteredCategories.length > 0) {
      setSelectedCategoryId(filteredCategories[0].id);
    }
  }, [filteredCategories, selectedCategoryId]);

  const handleDueDateChange = useCallback((_: DateTimePickerEvent, date?: Date) => {
    setShowDueDatePicker(false);
    if (date) setDueDate(date);
  }, []);

  const atFreeLimit = !isPremium && (activeLoansCount ?? 0) >= FREE_LOAN_LIMIT;

  const canSubmit = selectedPersonId !== null && selectedAccountId !== null && selectedCategoryId !== null && parseAmount(amountInput) > 0;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;

    if (atFreeLimit) {
      router.push('/premium');
      return;
    }

    const amount = parseAmount(amountInput);
    const account = accounts.find(a => a.id === selectedAccountId);
    if (!account) return;

    setIsSubmitting(true);
    try {
      await createLoan.mutateAsync({
        data: {
          personId: selectedPersonId!,
          type: loanType,
          principal: amount,
          currency: account.currency,
          accountId: selectedAccountId!,
          categoryId: selectedCategoryId!,
          dueDate: dueDate ? dueDate.toISOString().slice(0, 10) : undefined,
          note: note.trim(),
        },
        txPayload: {
          categoryId: selectedCategoryId!,
          note: note.trim(),
          datetime: new Date().toISOString(),
        },
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', toErrorMessage(e, 'Failed to create loan.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, isSubmitting, atFreeLimit, amountInput, accounts, selectedAccountId, selectedPersonId, selectedCategoryId, loanType, dueDate, note, createLoan, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageBackground />
      <Header
        title="New loan"
        showBack
        rightAction={
          <BentoPressable
            style={[styles.saveBtn, (!canSubmit || isSubmitting) && styles.saveBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            <Text style={[styles.saveBtnText, { fontFamily: typography.fonts.semibold }]}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </Text>
          </BentoPressable>
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Type toggle */}
          <View style={styles.typeRow}>
            <BentoPressable
              style={[styles.typeBtn, loanType === 'lend' && { backgroundColor: colors.primary }]}
              onPress={() => setLoanType('lend')}
            >
              <HugeiconsIcon icon={Money01Icon} size={16} color={loanType === 'lend' ? colors.primaryForeground : colors.textMuted} />
              <Text style={[styles.typeBtnText, { fontFamily: typography.fonts.semibold, color: loanType === 'lend' ? colors.primaryForeground : colors.textMuted }]}>
                I lent
              </Text>
            </BentoPressable>
            <BentoPressable
              style={[styles.typeBtn, loanType === 'borrow' && { backgroundColor: colors.primary }]}
              onPress={() => setLoanType('borrow')}
            >
              <HugeiconsIcon icon={Coins01Icon} size={16} color={loanType === 'borrow' ? colors.primaryForeground : colors.textMuted} />
              <Text style={[styles.typeBtnText, { fontFamily: typography.fonts.semibold, color: loanType === 'borrow' ? colors.primaryForeground : colors.textMuted }]}>
                I borrowed
              </Text>
            </BentoPressable>
          </View>

          {/* Amount */}
          <View style={styles.amountCard}>
            <Text style={[styles.amountLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>
              {loanType === 'lend' ? 'Amount lent' : 'Amount borrowed'}
            </Text>
            <View style={styles.amountRow}>
              {selectedAccount && (
                <Text style={[styles.currency, { fontFamily: typography.fonts.bold, color: colors.textMuted }]}>
                  {selectedAccount.currency}
                </Text>
              )}
              <TextInput
                style={[styles.amountInput, { fontFamily: typography.fonts.bold, color: colors.text }]}
                value={amountInput}
                onChangeText={setAmountInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted + '60'}
                returnKeyType="done"
                onSubmitEditing={() => noteRef.current?.focus()}
              />
            </View>
          </View>

          {/* Person */}
          <View style={styles.fieldSection}>
            <Text style={[styles.fieldLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>
              {loanType === 'lend' ? 'Lent to' : 'Borrowed from'}
            </Text>
            <BentoPressable style={styles.personPicker} onPress={() => setShowPersonPicker(true)}>
              {selectedPerson ? (
                <View style={styles.personRow}>
                  <PersonAvatar name={selectedPerson.name} color={colorNumberToHex(selectedPerson.color)} size={32} />
                  <Text style={[styles.personName, { fontFamily: typography.fonts.medium, color: colors.text }]}>
                    {selectedPerson.name}
                  </Text>
                </View>
              ) : (
                <View style={styles.personRow}>
                  <HugeiconsIcon icon={HandshakeIcon} size={20} color={colors.textMuted} />
                  <Text style={[styles.personPlaceholder, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                    Select person
                  </Text>
                </View>
              )}
              <HugeiconsIcon icon={UnfoldMoreIcon} size={18} color={colors.textMuted} />
            </BentoPressable>
          </View>

          {/* Account */}
          <View style={styles.fieldSection}>
            <TransactionAccountPicker
              accounts={accounts}
              selectedId={selectedAccountId}
              onSelect={setSelectedAccountId}
              label={loanType === 'lend' ? 'From account' : 'Into account'}
            />
          </View>

          {/* Category */}
          <View style={styles.fieldSection}>
            <TransactionCategoryPicker
              categories={filteredCategories}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
            />
          </View>

          {/* Due date */}
          <View style={styles.fieldSection}>
            <Text style={[styles.fieldLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>
              Due date (optional)
            </Text>
            <BentoPressable style={styles.dateRow} onPress={() => setShowDueDatePicker(true)}>
              <HugeiconsIcon icon={Calendar03Icon} size={18} color={colors.textMuted} />
              <Text style={[styles.dateText, { fontFamily: typography.fonts.regular, color: dueDate ? colors.text : colors.textMuted }]}>
                {dueDate ? format(dueDate, 'MMM d, yyyy') : 'No due date'}
              </Text>
              {dueDate && (
                <BentoPressable onPress={() => setDueDate(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={[{ fontFamily: typography.fonts.regular, color: colors.danger, fontSize: 13 }]}>Clear</Text>
                </BentoPressable>
              )}
            </BentoPressable>
          </View>

          {/* Note */}
          <View style={styles.fieldSection}>
            <Text style={[styles.fieldLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>
              Note (optional)
            </Text>
            <View style={styles.noteWrap}>
              <TextInput
                ref={noteRef}
                style={[styles.noteInput, { fontFamily: typography.fonts.regular, color: colors.text }]}
                value={note}
                onChangeText={setNote}
                placeholder="What's this for?"
                placeholderTextColor={colors.textMuted + '60'}
                multiline
                maxLength={200}
                returnKeyType="done"
              />
            </View>
          </View>

          {atFreeLimit && (
            <View style={styles.limitBanner}>
              <Text style={[styles.limitText, { fontFamily: typography.fonts.regular, color: colors.warning }]}>
                Free plan: {FREE_LOAN_LIMIT} active loans max. Upgrade for unlimited.
              </Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {showDueDatePicker && (
        <DateTimePicker
          value={dueDate ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={handleDueDateChange}
        />
      )}

      <PersonPickerBottomSheet
        visible={showPersonPicker}
        onClose={() => setShowPersonPicker(false)}
        onSelect={(id) => { setSelectedPersonId(id); setShowPersonPicker(false); }}
        selectedId={selectedPersonId}
        persons={persons}
      />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, spacing, radius, shadow, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingTop: spacing('3'), paddingBottom: spacing('12') },
    saveBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('2'),
      borderRadius: radius('lg'),
    },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { color: colors.primaryForeground, fontSize: 14 },
    typeRow: {
      flexDirection: 'row',
      gap: spacing('2'),
      marginHorizontal: spacing('4'),
      marginBottom: spacing('4'),
      backgroundColor: colors.surface,
      padding: spacing('1'),
      borderRadius: radius('xl'),
      ...shadow('sm'),
    },
    typeBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('1.5'),
      paddingVertical: spacing('2.5'),
      borderRadius: radius('lg'),
    },
    typeBtnText: { fontSize: 14 },
    amountCard: {
      marginHorizontal: spacing('4'),
      marginBottom: spacing('4'),
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      ...shadow('sm'),
    },
    amountLabel: { fontSize: 12, textTransform: 'uppercase', marginBottom: spacing('2') },
    amountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
    currency: { fontSize: 22 },
    amountInput: { flex: 1, fontSize: 36, paddingVertical: 0 },
    fieldSection: { marginHorizontal: spacing('4'), marginBottom: spacing('4') },
    fieldLabel: { fontSize: 12, textTransform: 'uppercase', marginBottom: spacing('2') },
    personPicker: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('3'),
      ...shadow('sm'),
    },
    personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
    personName: { fontSize: 15 },
    personPlaceholder: { fontSize: 15 },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('3'),
      ...shadow('sm'),
    },
    dateText: { flex: 1, fontSize: 15 },
    noteWrap: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('3'),
      ...shadow('sm'),
    },
    noteInput: { fontSize: 15, minHeight: 60 },
    limitBanner: {
      marginHorizontal: spacing('4'),
      padding: spacing('3'),
      backgroundColor: colors.warning + '15',
      borderRadius: radius('lg'),
    },
    limitText: { fontSize: 13 },
  });
