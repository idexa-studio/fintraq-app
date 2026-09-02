import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BentoPressable } from '../../../components/ui/BentoPressable';
import { Header } from '../../../components/ui/Header';
import { PageBackground } from '../../../components/ui/PageBackground';
import { PersonAvatar } from '../../../components/ui/PersonAvatar';
import { IconAvatar } from '../../../components/ui/IconAvatar';
import { useAccounts } from '../../accounts/hooks/accounts';
import { PersonPickerBottomSheet } from '../../persons/components/PersonPickerBottomSheet';
import { usePersons } from '../../persons/hooks/persons';
import { TransactionAccountPicker } from '../../transactions/components/TransactionAccountPicker';
import { TransactionAmountInput } from '../../transactions/components/TransactionAmountInput';
import { usePremium } from '../../../providers/PremiumProvider';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { colorNumberToHex } from '../../../utils/format';
import { toErrorMessage } from '../../../utils/errors';
import { useCreateLoan, useLoansCount } from '../hooks/loans';
import {
  Calendar03Icon,
  Coins02Icon,
  HandshakeIcon,
  Money01Icon,
  UnfoldMoreIcon,
  PencilEdit01Icon,
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
  const { isPremium, showAlert } = usePremium();

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

  const noteRef = useRef<TextInput>(null);

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
        title: 'Error',
        message: toErrorMessage(e, 'Failed to create loan.'),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, isSubmitting, atFreeLimit, amountInput, accounts, selectedAccountId, selectedPersonId, loanType, dueDate, note, createLoan, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageBackground />
      <Header title="New loan" showBack />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Type toggle */}
          <View style={styles.typeRow}>
            <BentoPressable
              style={[styles.typeBtn, loanType === 'lend' && { backgroundColor: colors.primary + '14' }]}
              onPress={() => setLoanType('lend')}
            >
              <HugeiconsIcon icon={Money01Icon} size={16} color={loanType === 'lend' ? colors.primary : colors.textMuted} />
              <Text style={[styles.typeBtnText, { color: loanType === 'lend' ? colors.primary : colors.textMuted }]}>
                I lent
              </Text>
            </BentoPressable>
            <BentoPressable
              style={[styles.typeBtn, loanType === 'borrow' && { backgroundColor: colors.primary + '14' }]}
              onPress={() => setLoanType('borrow')}
            >
              <HugeiconsIcon icon={Coins02Icon} size={16} color={loanType === 'borrow' ? colors.primary : colors.textMuted} />
              <Text style={[styles.typeBtnText, { color: loanType === 'borrow' ? colors.primary : colors.textMuted }]}>
                I borrowed
              </Text>
            </BentoPressable>
          </View>

          {/* Reusable payment amount input */}
          <TransactionAmountInput
            value={amountInput}
            onChange={setAmountInput}
            currency={selectedAccount?.currency ?? ''}
          />

          {/* Person picker */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>
              {loanType === 'lend' ? 'Lent to' : 'Borrowed from (optional)'}
            </Text>
            <BentoPressable style={styles.personPickerBtn} onPress={() => setShowPersonPicker(true)}>
              {selectedPerson ? (
                <>
                  <PersonAvatar name={selectedPerson.name} color={colorNumberToHex(selectedPerson.color)} size={36} />
                  <View style={styles.textContainer}>
                    <Text style={styles.personValueLabel}>Selected Person</Text>
                    <Text style={styles.personValueText} numberOfLines={1}>
                      {selectedPerson.name}
                    </Text>
                  </View>
                  <BentoPressable onPress={() => setSelectedPersonId(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.clearText}>Clear</Text>
                  </BentoPressable>
                </>
              ) : (
                <>
                  <IconAvatar icon={HandshakeIcon} color={colors.primary} variant="subtle" size={36} iconSize={18} />
                  <View style={styles.textContainer}>
                    <Text style={styles.personValueLabel}>Person</Text>
                    <Text style={[styles.personValueText, { color: colors.textMuted }]} numberOfLines={1}>
                      {loanType === 'lend' ? 'Select contact' : 'Select contact (optional)'}
                    </Text>
                  </View>
                  <HugeiconsIcon icon={UnfoldMoreIcon} size={16} color={colors.textMuted} />
                </>
              )}
            </BentoPressable>
          </View>

          {/* Account */}
          <TransactionAccountPicker
            accounts={accounts}
            selectedId={selectedAccountId}
            onSelect={setSelectedAccountId}
            label={loanType === 'lend' ? 'From account' : 'Into account'}
          />

          {/* Due date trigger styled like transactions */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>
              Due date (optional)
            </Text>
            <BentoPressable style={styles.datePickerBtn} onPress={() => setShowDueDatePicker(true)}>
              <IconAvatar icon={Calendar03Icon} color={colors.primary} variant="subtle" size={36} iconSize={18} />
              <View style={styles.textContainer}>
                <Text style={styles.dateLabel}>Due Date</Text>
                <Text style={[styles.dateValueText, !dueDate && { color: colors.textMuted }]} numberOfLines={1}>
                  {dueDate ? format(dueDate, 'MMM d, yyyy') : 'No due date'}
                </Text>
              </View>
              {dueDate ? (
                <BentoPressable onPress={() => setDueDate(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.clearText}>Clear</Text>
                </BentoPressable>
              ) : (
                <HugeiconsIcon icon={UnfoldMoreIcon} size={16} color={colors.textMuted} />
              )}
            </BentoPressable>
          </View>

          {/* Note input container styled like transactions */}
          <View style={styles.fieldSection}>
            <View style={styles.noteContainer}>
              <View style={styles.noteHeader}>
                <IconAvatar icon={PencilEdit01Icon} color={colors.primary} variant="subtle" size={32} iconSize={16} />
                <Text style={styles.noteLabel}>Note</Text>
              </View>
              <TextInput
                ref={noteRef}
                style={styles.noteInput}
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
              <Text style={styles.limitText}>
                Free plan: {FREE_LOAN_LIMIT} active loans max. Upgrade for unlimited.
              </Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveBtn, (!canSubmit || isSubmitting) && styles.saveBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Text style={styles.saveBtnText}>
              Create loan
            </Text>
          )}
        </Pressable>
      </View>

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

const createStyles = ({ colors, spacing, radius, layout, typography, sizes }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingTop: spacing('3'), paddingBottom: spacing('12') },
    footer: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: spacing('8'),
    },
    saveBtn: {
      height: 52,
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: {
      fontFamily: typography.styles.buttonLabel.fontFamily,
      fontSize: 16,
      color: colors.primaryForeground,
    },
    typeRow: {
      flexDirection: 'row',
      gap: spacing('2'),
      marginHorizontal: layout.screenPadding,
      marginBottom: spacing('4'),
      backgroundColor: colors.surface,
      padding: spacing('1'),
      borderRadius: radius('xl'),
      height: sizes.button.md.height,
      alignItems: 'center',
    },
    typeBtn: {
      flex: 1,
      height: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('1.5'),
      borderRadius: radius('lg'),
    },
    typeBtnText: {
      fontSize: typography.sizes.md,
      fontFamily: typography.styles.chipLabelActive.fontFamily,
    },
    fieldSection: { marginHorizontal: layout.screenPadding, marginBottom: spacing('4') },
    fieldLabel: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      marginBottom: spacing('2'),
    },
    personPickerBtn: {
      height: sizes.input.md.height,
      borderRadius: sizes.input.md.borderRadius,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('3'),
      gap: spacing('2.5'),
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    personValueLabel: {
      fontFamily: typography.styles.rowMeta.fontFamily,
      fontSize: 10,
      color: colors.textMuted,
      marginBottom: Platform.OS === 'ios' ? 1 : 0,
    },
    personValueText: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: 13,
      color: colors.text,
    },
    datePickerBtn: {
      height: sizes.input.md.height,
      borderRadius: sizes.input.md.borderRadius,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('3'),
      gap: spacing('2.5'),
    },
    dateLabel: {
      fontFamily: typography.styles.rowMeta.fontFamily,
      fontSize: 10,
      color: colors.textMuted,
      marginBottom: Platform.OS === 'ios' ? 1 : 0,
    },
    dateValueText: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: 13,
      color: colors.text,
    },
    clearText: {
      fontFamily: typography.styles.rowMeta.fontFamily,
      color: colors.danger,
      fontSize: typography.sizes.sm,
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
    noteLabel: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: 13,
      color: colors.text,
    },
    noteInput: {
      fontFamily: typography.styles.inputValue.fontFamily,
      fontSize: 14,
      color: colors.text,
      textAlignVertical: 'top',
      minHeight: 80,
      padding: 0,
    },
    limitBanner: {
      marginHorizontal: layout.screenPadding,
      padding: spacing('3'),
      backgroundColor: colors.warning + '15',
      borderRadius: radius('lg'),
    },
    limitText: {
      fontSize: typography.sizes.sm,
      fontFamily: typography.styles.rowMeta.fontFamily,
      color: colors.warning,
    },
  });
