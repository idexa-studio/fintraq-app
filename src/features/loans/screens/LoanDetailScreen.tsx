import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Calendar03Icon,
  CheckmarkCircle01Icon,
  Delete01Icon,
  Coins01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BentoPressable } from '../../../components/ui/BentoPressable';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { MoneyText } from '../../../components/ui/MoneyText';
import { PageBackground } from '../../../components/ui/PageBackground';
import { PersonAvatar } from '../../../components/ui/PersonAvatar';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useCategories } from '../../categories/hooks/categories';
import { TransactionAccountPicker } from '../../transactions/components/TransactionAccountPicker';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { colorNumberToHex } from '../../../utils/format';
import { toErrorMessage } from '../../../utils/errors';
import { LoanReminderSection } from '../components/LoanReminderSection';
import { LoanStatusBadge } from '../components/LoanStatusBadge';
import { OutstandingBar } from '../components/OutstandingBar';
import { RepaymentRow } from '../components/RepaymentRow';
import { useAddRepayment, useDeleteLoan, useLoanRepayments, useLoanWithStats, useMarkLoanRepaid } from '../hooks/loans';
import { useLoanReminders } from '../hooks/useLoanReminders';

const parseAmount = (raw: string) => {
  const n = parseFloat(raw.replace(',', '.').replace(/[^0-9.]/g, ''));
  return isFinite(n) ? n : 0;
};

export const LoanDetailScreen = React.memo(function LoanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const loanId = Number(id);
  const router = useRouter();
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: loan, isLoading } = useLoanWithStats(loanId);
  const { data: repayments } = useLoanRepayments(loanId);
  const { data: allAccounts } = useAccounts();
  const { data: allCategories } = useCategories();
  const addRepayment = useAddRepayment();
  const markRepaid = useMarkLoanRepaid();
  const deleteLoan = useDeleteLoan();
  const { cancelAllLoanReminders } = useLoanReminders();

  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayAccountId, setRepayAccountId] = useState<number | null>(null);
  const [repayDate, setRepayDate] = useState<Date>(() => new Date());
  const [repayNote, setRepayNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sameCurrencyAccounts = useMemo(() => {
    if (!allAccounts || !loan) return [];
    return allAccounts.filter(a => a.currency === loan.currency);
  }, [allAccounts, loan]);

  const defaultRepayAccount = useMemo(() => {
    if (!loan || !allAccounts) return null;
    return allAccounts.find(a => a.id === loan.accountId) ?? sameCurrencyAccounts[0] ?? null;
  }, [loan, allAccounts, sameCurrencyAccounts]);

  const effectiveRepayAccountId = repayAccountId ?? defaultRepayAccount?.id ?? null;

  const defaultCategoryId = useMemo(() => {
    if (!allCategories || !loan) return null;
    return loan.categoryId;
  }, [allCategories, loan]);

  const sortedRepayments = useMemo(() => repayments ?? [], [repayments]);

  const handleRepayOpen = useCallback(() => {
    setRepayAmount('');
    setRepayNote('');
    setRepayDate(new Date());
    setRepayAccountId(null);
    setShowRepayModal(true);
  }, []);

  const handleRepaySubmit = useCallback(async () => {
    if (!loan || isSubmitting) return;
    const amount = parseAmount(repayAmount);
    if (amount <= 0) { Alert.alert('Invalid amount', 'Enter a valid repayment amount.'); return; }
    if (!effectiveRepayAccountId) { Alert.alert('No account', 'Select a repayment account.'); return; }
    if (!defaultCategoryId) { Alert.alert('No category', 'No category found for this loan.'); return; }

    setIsSubmitting(true);
    try {
      const result = await addRepayment.mutateAsync({
        loanId: loan.id,
        loanType: loan.type as 'lend' | 'borrow',
        personId: loan.personId,
        accountId: effectiveRepayAccountId,
        categoryId: defaultCategoryId,
        amount,
        datetime: repayDate.toISOString(),
        note: repayNote.trim(),
      });

      setShowRepayModal(false);

      if (result.isFullyRepaid) {
        await cancelAllLoanReminders(loan);
        Alert.alert('Fully repaid', `${loan.personName}'s loan is completely settled.`);
      }
    } catch (e) {
      Alert.alert('Error', toErrorMessage(e, 'Failed to record repayment.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [loan, isSubmitting, repayAmount, effectiveRepayAccountId, defaultCategoryId, repayDate, repayNote, addRepayment, cancelAllLoanReminders]);

  const handleMarkRepaid = useCallback(async () => {
    if (!loan) return;
    Alert.alert(
      'Mark as repaid?',
      'This will close the loan and cancel all reminders.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark repaid',
          onPress: async () => {
            await cancelAllLoanReminders(loan);
            await markRepaid.mutateAsync(loan.id);
          },
        },
      ],
    );
  }, [loan, markRepaid, cancelAllLoanReminders]);

  const handleDelete = useCallback(async () => {
    if (!loan) return;
    await cancelAllLoanReminders(loan);
    await deleteLoan.mutateAsync(loan.id);
    setShowDeleteConfirm(false);
    router.back();
  }, [loan, deleteLoan, cancelAllLoanReminders, router]);

  const handleDateChange = useCallback((_: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date) setRepayDate(date);
  }, []);

  if (isLoading || !loan) {
    return (
      <SafeAreaView style={styles.container}>
        <PageBackground />
        <Header title="Loan" showBack />
        <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  const personColor = colorNumberToHex(loan.personColor);
  const pct = loan.principal > 0 ? Math.round((loan.repaid / loan.principal) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageBackground />
      <Header
        title={loan.type === 'lend' ? 'Lent to ' + loan.personName : 'Borrowed from ' + loan.personName}
        showBack
        rightAction={
          <View style={styles.headerActions}>
            <BentoPressable style={styles.iconBtn} onPress={() => setShowDeleteConfirm(true)}>
              <HugeiconsIcon icon={Delete01Icon} size={20} color={colors.danger} />
            </BentoPressable>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <PersonAvatar name={loan.personName} color={personColor} size={52} />
            <View style={styles.heroInfo}>
              <Text style={[styles.heroName, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
                {loan.personName}
              </Text>
              <Text style={[styles.heroSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                {loan.type === 'lend' ? 'Lent' : 'Borrowed'} · {loan.accountName}
              </Text>
            </View>
            <LoanStatusBadge status={loan.computedStatus} />
          </View>

          {/* Principal vs outstanding */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>Principal</Text>
              <MoneyText amount={loan.principal} currency={loan.currency} type="NONE" weight="bold" compact style={styles.statValue} />
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>Repaid</Text>
              <MoneyText amount={loan.repaid} currency={loan.currency} type="NONE" weight="bold" compact style={styles.statValue} />
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>Outstanding</Text>
              <MoneyText
                amount={loan.outstanding}
                currency={loan.currency}
                type={loan.type === 'lend' ? 'CR' : 'DR'}
                weight="bold"
                compact
                style={styles.statValue}
              />
            </View>
          </View>

          <OutstandingBar
            principal={loan.principal}
            repaid={loan.repaid}
            color={loan.computedStatus === 'overdue' ? colors.danger : loan.computedStatus === 'repaid' ? colors.success : colors.primary}
          />
          <Text style={[styles.pctText, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
            {pct}% repaid
          </Text>

          {loan.dueDate && (
            <View style={styles.dueDateRow}>
              <HugeiconsIcon icon={Calendar03Icon} size={14} color={loan.computedStatus === 'overdue' ? colors.danger : colors.textMuted} />
              <Text style={[styles.dueDateText, { fontFamily: typography.fonts.regular, color: loan.computedStatus === 'overdue' ? colors.danger : colors.textMuted }]}>
                Due {format(new Date(loan.dueDate), 'MMM d, yyyy')}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {loan.computedStatus !== 'repaid' && (
          <View style={styles.actionsRow}>
            <BentoPressable style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleRepayOpen}>
              <HugeiconsIcon icon={Coins01Icon} size={16} color={colors.primaryForeground} />
              <Text style={[styles.actionText, { fontFamily: typography.fonts.semibold, color: colors.primaryForeground }]}>
                Record repayment
              </Text>
            </BentoPressable>
            <BentoPressable style={[styles.actionBtn, { backgroundColor: colors.success + '20' }]} onPress={handleMarkRepaid}>
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color={colors.success} />
              <Text style={[styles.actionText, { fontFamily: typography.fonts.semibold, color: colors.success }]}>
                Mark repaid
              </Text>
            </BentoPressable>
          </View>
        )}

        {/* Timeline */}
        {sortedRepayments.length > 0 && (
          <View style={styles.timelineSection}>
            <Text style={[styles.sectionLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>
              History
            </Text>
            {sortedRepayments.map((row, idx) => {
              const isCreation = idx === sortedRepayments.length - 1;
              return (
                <RepaymentRow
                  key={row.id}
                  row={row}
                  loanType={loan.type as 'lend' | 'borrow'}
                  isFirst={idx === 0}
                  isLast={idx === sortedRepayments.length - 1}
                  isCreation={isCreation}
                />
              );
            })}
          </View>
        )}

        {/* Reminders */}
        {loan.computedStatus !== 'repaid' && <LoanReminderSection loan={loan} />}

        {loan.note ? (
          <View style={styles.noteSection}>
            <Text style={[styles.sectionLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>
              Note
            </Text>
            <View style={styles.noteCard}>
              <Text style={[styles.noteText, { fontFamily: typography.fonts.regular, color: colors.text }]}>
                {loan.note}
              </Text>
            </View>
          </View>
        ) : null}

      </ScrollView>

      {/* Repayment modal */}
      <Modal visible={showRepayModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowRepayModal(false)}>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          <Header
            title="Record repayment"
            showBack
            onBack={() => setShowRepayModal(false)}
            rightAction={
              <BentoPressable
                style={[styles.saveBtn, isSubmitting && { opacity: 0.5 }]}
                onPress={handleRepaySubmit}
                disabled={isSubmitting}
              >
                <Text style={[styles.saveBtnText, { fontFamily: typography.fonts.semibold }]}>
                  {isSubmitting ? 'Saving…' : 'Save'}
                </Text>
              </BentoPressable>
            }
          />
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Person (locked) */}
              <View style={styles.lockedPerson}>
                <PersonAvatar name={loan.personName} color={personColor} size={36} />
                <View>
                  <Text style={[styles.lockedPersonName, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
                    {loan.personName}
                  </Text>
                  <Text style={[styles.lockedPersonSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                    Outstanding: {loan.outstanding.toFixed(2)} {loan.currency}
                  </Text>
                </View>
              </View>

              {/* Amount */}
              <View style={styles.amountCard}>
                <Text style={[styles.fieldLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>
                  {loan.type === 'lend' ? 'Amount received' : 'Amount sent'}
                </Text>
                <View style={styles.amountRow}>
                  <Text style={[styles.currency, { fontFamily: typography.fonts.bold, color: colors.textMuted }]}>
                    {loan.currency}
                  </Text>
                  <TextInput
                    style={[styles.amountInput, { fontFamily: typography.fonts.bold, color: colors.text }]}
                    value={repayAmount}
                    onChangeText={setRepayAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted + '60'}
                    autoFocus
                  />
                </View>
                {loan.outstanding > 0 && (
                  <BentoPressable onPress={() => setRepayAmount(loan.outstanding.toFixed(2))} style={styles.fullAmountBtn}>
                    <Text style={[styles.fullAmountText, { fontFamily: typography.fonts.medium, color: colors.primary }]}>
                      Full amount ({loan.outstanding.toFixed(2)})
                    </Text>
                  </BentoPressable>
                )}
              </View>

              {/* Account */}
              <View style={styles.fieldSection}>
                <TransactionAccountPicker
                  accounts={sameCurrencyAccounts}
                  selectedId={effectiveRepayAccountId}
                  onSelect={setRepayAccountId}
                  label={loan.type === 'lend' ? 'Received into' : 'Sent from'}
                />
              </View>

              {/* Date */}
              <View style={styles.fieldSection}>
                <Text style={[styles.fieldLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>
                  Date
                </Text>
                <BentoPressable style={styles.dateRow} onPress={() => setShowDatePicker(true)}>
                  <HugeiconsIcon icon={Calendar03Icon} size={18} color={colors.textMuted} />
                  <Text style={[styles.dateText, { fontFamily: typography.fonts.regular, color: colors.text }]}>
                    {format(repayDate, 'MMM d, yyyy')}
                  </Text>
                </BentoPressable>
              </View>

              {/* Note */}
              <View style={styles.fieldSection}>
                <Text style={[styles.fieldLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>
                  Note (optional)
                </Text>
                <View style={styles.noteInputWrap}>
                  <TextInput
                    style={[styles.noteInput, { fontFamily: typography.fonts.regular, color: colors.text }]}
                    value={repayNote}
                    onChangeText={setRepayNote}
                    placeholder="Optional note"
                    placeholderTextColor={colors.textMuted + '60'}
                    returnKeyType="done"
                  />
                </View>
              </View>

            </ScrollView>
          </KeyboardAvoidingView>

          {showDatePicker && (
            <DateTimePicker
              value={repayDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}
        </SafeAreaView>
      </Modal>

      <ConfirmDialog
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete loan"
        message={`Delete this loan with ${loan.personName}? All associated transactions will keep their data but lose the loan link.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteLoan.isPending}
      />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, spacing, radius, shadow, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingTop: spacing('3'), paddingBottom: spacing('12') },
    headerActions: { flexDirection: 'row', gap: spacing('2') },
    iconBtn: {
      width: layout.minTouchTarget,
      height: layout.minTouchTarget,
      borderRadius: radius('lg'),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    heroCard: {
      marginHorizontal: spacing('4'),
      marginBottom: spacing('4'),
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      padding: spacing('4'),
      ...shadow('sm'),
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing('3'), marginBottom: spacing('4') },
    heroInfo: { flex: 1 },
    heroName: { fontSize: 18 },
    heroSub: { fontSize: 13, marginTop: 2 },
    statsRow: { flexDirection: 'row', marginBottom: spacing('3') },
    statItem: { flex: 1, alignItems: 'center', gap: spacing('1') },
    statLabel: { fontSize: 11, textTransform: 'uppercase' },
    statValue: { fontSize: 16 },
    pctText: { fontSize: 12, marginTop: spacing('1') },
    dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing('1'), marginTop: spacing('2') },
    dueDateText: { fontSize: 13 },
    actionsRow: { flexDirection: 'row', gap: spacing('3'), marginHorizontal: spacing('4'), marginBottom: spacing('4') },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('1.5'),
      paddingVertical: spacing('3'),
      borderRadius: radius('xl'),
    },
    actionText: { fontSize: 14 },
    timelineSection: { marginBottom: spacing('2') },
    sectionLabel: { fontSize: 12, textTransform: 'uppercase', marginHorizontal: spacing('4'), marginBottom: spacing('2'), marginTop: spacing('2') },
    noteSection: { marginTop: spacing('2') },
    noteCard: {
      marginHorizontal: spacing('4'),
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('3'),
      ...shadow('sm'),
    },
    noteText: { fontSize: 14, lineHeight: 20 },
    // Modal styles
    modalScroll: { paddingTop: spacing('3'), paddingBottom: spacing('12') },
    saveBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('2'),
      borderRadius: radius('lg'),
    },
    saveBtnText: { color: colors.primaryForeground, fontSize: 14 },
    lockedPerson: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      marginHorizontal: spacing('4'),
      marginBottom: spacing('4'),
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('3'),
      ...shadow('sm'),
    },
    lockedPersonName: { fontSize: 16 },
    lockedPersonSub: { fontSize: 12, marginTop: 2 },
    amountCard: {
      marginHorizontal: spacing('4'),
      marginBottom: spacing('4'),
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      ...shadow('sm'),
    },
    fieldLabel: { fontSize: 12, textTransform: 'uppercase', marginBottom: spacing('2') },
    amountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
    currency: { fontSize: 22 },
    amountInput: { flex: 1, fontSize: 36, paddingVertical: 0 },
    fullAmountBtn: { marginTop: spacing('2'), alignSelf: 'flex-start' },
    fullAmountText: { fontSize: 13 },
    fieldSection: { marginHorizontal: spacing('4'), marginBottom: spacing('4') },
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
    noteInputWrap: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('3'),
      ...shadow('sm'),
    },
    noteInput: { fontSize: 15 },
  });
