import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Calendar03Icon,
  CheckmarkCircle01Icon,
  Delete01Icon,
  Coins02Icon,
  PencilEdit01Icon,
  UnfoldMoreIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BentoPressable } from '../../../components/ui/BentoPressable';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { MoneyText } from '../../../components/ui/MoneyText';
import { PageBackground } from '../../../components/ui/PageBackground';
import { PersonAvatar } from '../../../components/ui/PersonAvatar';
import { IconAvatar } from '../../../components/ui/IconAvatar';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useCategories } from '../../categories/hooks/categories';
import { TransactionAccountPicker } from '../../transactions/components/TransactionAccountPicker';
import { TransactionAmountInput } from '../../transactions/components/TransactionAmountInput';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { usePremium } from '../../../providers/PremiumProvider';
import { colorNumberToHex } from '../../../utils/format';
import { toErrorMessage } from '../../../utils/errors';
import { LoanReminderSection } from '../components/LoanReminderSection';
import { LoanStatusBadge } from '../components/LoanStatusBadge';
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
  const { showAlert } = usePremium();

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
  const [showMarkRepaidConfirm, setShowMarkRepaidConfirm] = useState(false);
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

  const parsedAmountVal = useMemo(() => parseAmount(repayAmount), [repayAmount]);
  const canSubmitRepay = useMemo(() => {
    if (!loan || isSubmitting) return false;
    if (parsedAmountVal <= 0 || parsedAmountVal > loan.outstanding) return false;
    if (!effectiveRepayAccountId || !defaultCategoryId) return false;
    return true;
  }, [loan, isSubmitting, parsedAmountVal, effectiveRepayAccountId, defaultCategoryId]);

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
    if (amount <= 0) {
      showAlert({ title: 'Invalid amount', message: 'Enter a valid repayment amount.', type: 'warning' });
      return;
    }
    if (amount > loan.outstanding) {
      showAlert({
        title: 'Overpayment not allowed',
        message: `Repayment amount cannot exceed the outstanding balance of ${loan.outstanding.toFixed(2)} ${loan.currency}.`,
        type: 'warning',
      });
      return;
    }
    if (!effectiveRepayAccountId) {
      showAlert({ title: 'No account', message: 'Select a repayment account.', type: 'warning' });
      return;
    }
    if (!defaultCategoryId) {
      showAlert({ title: 'No category', message: 'No category found for this loan.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addRepayment.mutateAsync({
        loanId: loan.id,
        loanType: loan.type as 'lend' | 'borrow',
        personId: loan.personId ?? null,
        accountId: effectiveRepayAccountId,
        categoryId: defaultCategoryId,
        amount,
        datetime: repayDate.toISOString(),
        note: repayNote.trim(),
      });

      setShowRepayModal(false);

      if (result.isFullyRepaid) {
        await cancelAllLoanReminders(loan);
        showAlert({
          title: 'Fully repaid',
          message: `${loan.personName ?? 'This'} loan is completely settled.`,
          type: 'success',
        });
      }
    } catch (e) {
      showAlert({
        title: 'Error',
        message: toErrorMessage(e, 'Failed to record repayment.'),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [loan, isSubmitting, repayAmount, effectiveRepayAccountId, defaultCategoryId, repayDate, repayNote, addRepayment, cancelAllLoanReminders, showAlert]);

  const handleMarkRepaid = useCallback(() => {
    setShowMarkRepaidConfirm(true);
  }, []);

  const handleMarkRepaidConfirm = useCallback(async () => {
    if (!loan) return;
    setShowMarkRepaidConfirm(false);
    await cancelAllLoanReminders(loan);
    await markRepaid.mutateAsync(loan.id);
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

  const personColor = loan.personColor != null ? colorNumberToHex(loan.personColor) : '#8B8B8B';
  const personName = loan.personName ?? (loan.type === 'lend' ? 'Unknown' : 'Unnamed source');
  const pct = loan.principal > 0 ? Math.round((loan.repaid / loan.principal) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageBackground />
      <Header
        title={loan.type === 'lend' ? 'Lent to ' + personName : 'Borrowed from ' + personName}
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

        {/* Hero Card styled like Account detail hero */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface }]}>
          <View style={styles.heroTop}>
            <PersonAvatar name={personName} color={personColor} size={56} variant="solid" />
            <View style={styles.heroMeta}>
              <Text style={styles.heroName} numberOfLines={1}>{personName}</Text>
              <View style={styles.heroBadgeRow}>
                <View style={[styles.typeBadge, { backgroundColor: personColor + '20' }]}>
                  <Text style={[styles.typeBadgeText, { color: personColor }]}>
                    {loan.type === 'lend' ? 'Lent out' : 'Borrowed'}
                  </Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: colors.text + '0C' }]}>
                  <Text style={[styles.typeBadgeText, { color: colors.textMuted }]}>{loan.accountName}</Text>
                </View>
              </View>
            </View>
            <LoanStatusBadge status={loan.computedStatus} />
          </View>

          <Text style={styles.balanceLabel}>Outstanding balance</Text>
          <MoneyText
            amount={loan.outstanding}
            currency={loan.currency}
            type={loan.type === 'lend' ? 'CR' : 'DR'}
            weight="bold"
            style={styles.balance}
          />

          {/* Stats tiles */}
          <View style={styles.statsRow}>
            <View style={[styles.statTile, { backgroundColor: colors.text + '08' }]}>
              <Text style={styles.statLabel}>Principal</Text>
              <MoneyText amount={loan.principal} currency={loan.currency} type="NONE" weight="semibold" compact style={styles.statValue} />
            </View>
            <View style={[styles.statTile, { backgroundColor: colors.success + '12' }]}>
              <Text style={[styles.statLabel, { color: colors.success }]}>Repaid</Text>
              <MoneyText amount={loan.repaid} currency={loan.currency} type="NONE" weight="semibold" compact style={[styles.statValue, { color: colors.success }]} />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.pctRow}>
            <Text style={styles.pctText}>{pct}% repaid</Text>
            {loan.dueDate && (
              <Text style={[styles.pctText, loan.computedStatus === 'overdue' && { color: colors.danger }]}>
                Due {format(new Date(loan.dueDate), 'MMM d, yyyy')}
              </Text>
            )}
          </View>
        </View>

        {/* Actions */}
        {loan.computedStatus !== 'repaid' && (
          <View style={styles.actionsRow}>
            <BentoPressable style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleRepayOpen}>
              <HugeiconsIcon icon={Coins02Icon} size={16} color={colors.primaryForeground} />
              <Text style={[styles.actionText, { color: colors.primaryForeground }]}>
                Repay
              </Text>
            </BentoPressable>
            <BentoPressable style={[styles.actionBtn, { backgroundColor: colors.success + '20' }]} onPress={handleMarkRepaid}>
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color={colors.success} />
              <Text style={[styles.actionText, { color: colors.success }]}>
                Mark repaid
              </Text>
            </BentoPressable>
          </View>
        )}

        {/* Timeline */}
        {sortedRepayments.length > 0 && (
          <View style={styles.timelineSection}>
            <Text style={styles.sectionLabel}>
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
            <Text style={styles.sectionLabel}>
              Note
            </Text>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>
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
          />
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Person (locked) — only shown when a person is linked */}
              {loan.personId != null && (
                <View style={styles.lockedPerson}>
                  <PersonAvatar name={personName} color={personColor} size={36} />
                  <View>
                    <Text style={styles.lockedPersonName}>{personName}</Text>
                    <Text style={styles.lockedPersonSub}>
                      Outstanding: {loan.outstanding.toFixed(2)} {loan.currency}
                    </Text>
                  </View>
                </View>
              )}

              {/* Amount */}
              <TransactionAmountInput
                value={repayAmount}
                onChange={setRepayAmount}
                currency={loan.currency}
              />
              {parsedAmountVal > loan.outstanding && (
                <Text style={styles.errorText}>Amount exceeds outstanding balance ({loan.outstanding.toFixed(2)} {loan.currency})</Text>
              )}
              {loan.outstanding > 0 && (
                <BentoPressable onPress={() => setRepayAmount(loan.outstanding.toFixed(2))} style={styles.fullAmountBtn}>
                  <Text style={styles.fullAmountText}>
                    Full amount ({loan.outstanding.toFixed(2)} {loan.currency})
                  </Text>
                </BentoPressable>
              )}

              {/* Account */}
              <TransactionAccountPicker
                accounts={sameCurrencyAccounts}
                selectedId={effectiveRepayAccountId}
                onSelect={setRepayAccountId}
                label={loan.type === 'lend' ? 'Received into' : 'Sent from'}
              />

              {/* Date button styled like transaction date triggering */}
              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>
                  Date
                </Text>
                <BentoPressable style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
                  <IconAvatar icon={Calendar03Icon} color={colors.primary} variant="subtle" size={36} iconSize={18} />
                  <View style={styles.textContainer}>
                    <Text style={styles.dateLabel}>Date</Text>
                    <Text style={styles.dateValueText}>
                      {format(repayDate, 'MMM d, yyyy')}
                    </Text>
                  </View>
                  <HugeiconsIcon icon={UnfoldMoreIcon} size={16} color={colors.textMuted} />
                </BentoPressable>
              </View>

              {/* Note wrapper styled like transaction notes */}
              <View style={styles.fieldSection}>
                <View style={styles.noteContainer}>
                  <View style={styles.noteHeader}>
                    <IconAvatar icon={PencilEdit01Icon} color={colors.primary} variant="subtle" size={32} iconSize={16} />
                    <Text style={styles.noteLabel}>Note</Text>
                  </View>
                  <TextInput
                    style={styles.noteInput}
                    value={repayNote}
                    onChangeText={setRepayNote}
                    placeholder="Optional note"
                    placeholderTextColor={colors.textMuted + '60'}
                    multiline={true}
                    returnKeyType="done"
                  />
                </View>
              </View>

            </ScrollView>
          </KeyboardAvoidingView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.saveBtn, !canSubmitRepay && styles.saveBtnDisabled]}
              onPress={handleRepaySubmit}
              disabled={!canSubmitRepay}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Text style={styles.saveBtnText}>
                  Record repayment
                </Text>
              )}
            </Pressable>
          </View>

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

      {/* Prebuilt Dialog alerts */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete loan"
        message={`Delete this loan${loan.personName ? ` with ${loan.personName}` : ''}? All associated transactions will keep their data but lose the loan link.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteLoan.isPending}
      />

      <ConfirmDialog
        visible={showMarkRepaidConfirm}
        onClose={() => setShowMarkRepaidConfirm(false)}
        title="Mark as repaid?"
        message="This will close the loan and cancel all reminders."
        confirmLabel="Mark repaid"
        onConfirm={handleMarkRepaidConfirm}
        isLoading={markRepaid.isPending}
      />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, spacing, radius, layout, typography, sizes }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: spacing('12'),
    },
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
      borderRadius: radius('2xl'),
      padding: spacing('5'),
      marginBottom: spacing('4'),
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      marginBottom: spacing('4'),
    },
    heroMeta: {
      flex: 1,
      gap: spacing('1.5'),
    },
    heroName: {
      fontFamily: typography.styles.profileName.fontFamily,
      fontSize: typography.sizes.xl,
      color: colors.text,
    },
    heroBadgeRow: {
      flexDirection: 'row',
      gap: spacing('1.5'),
    },
    typeBadge: {
      paddingHorizontal: spacing('2.5'),
      paddingVertical: spacing('0.5'),
      borderRadius: radius('full'),
    },
    typeBadgeText: {
      fontFamily: typography.styles.chipLabelActive.fontFamily,
      fontSize: typography.sizes.xs,
    },
    balanceLabel: {
      fontFamily: typography.styles.rowMeta.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginBottom: spacing('1'),
    },
    balance: {
      fontSize: 36,
      lineHeight: 42,
      marginBottom: spacing('4'),
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing('3'),
      marginBottom: spacing('4'),
    },
    statTile: {
      flex: 1,
      borderRadius: radius('xl'),
      paddingVertical: spacing('2.5'),
      paddingHorizontal: spacing('3'),
      gap: spacing('0.5'),
    },
    statLabel: {
      fontFamily: typography.styles.rowMeta.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    statValue: {
      fontSize: typography.sizes.md,
      fontFamily: typography.styles.sectionLabel.fontFamily,
      color: colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: colors.text + '08',
      marginBottom: spacing('3'),
    },
    pctRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing('2'),
    },
    pctText: {
      fontFamily: typography.styles.rowMeta.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    actionsRow: { flexDirection: 'row', gap: spacing('3'), marginBottom: spacing('4') },
    actionBtn: {
      flex: 1,
      height: sizes.button.md.height,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('1.5'),
      borderRadius: radius('lg'),
    },
    actionText: {
      fontSize: typography.sizes.md,
      fontFamily: typography.styles.buttonLabel.fontFamily,
    },
    timelineSection: { marginBottom: spacing('2') },
    sectionLabel: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      marginBottom: spacing('2'),
      marginTop: spacing('2'),
    },
    noteSection: { marginTop: spacing('2') },
    noteCard: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('3'),
    },
    noteText: {
      fontSize: typography.sizes.md,
      lineHeight: 20,
      fontFamily: typography.styles.cardBody.fontFamily,
      color: colors.text,
    },
    // Modal styles
    modalScroll: { paddingTop: spacing('3'), paddingBottom: spacing('12') },
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
    lockedPerson: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      marginHorizontal: layout.screenPadding,
      marginBottom: spacing('4'),
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('3'),
    },
    lockedPersonName: {
      fontSize: typography.sizes.lg,
      fontFamily: typography.styles.rowLabel.fontFamily,
      color: colors.text,
    },
    lockedPersonSub: {
      fontSize: typography.sizes.xs,
      fontFamily: typography.styles.rowMeta.fontFamily,
      color: colors.textMuted,
      marginTop: 2,
    },
    errorText: {
      fontFamily: typography.styles.rowMeta.fontFamily,
      fontSize: 12,
      color: colors.danger,
      marginHorizontal: layout.screenPadding,
      marginBottom: spacing('3'),
    },
    fieldLabel: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      marginBottom: spacing('2'),
    },
    fullAmountBtn: {
      marginHorizontal: layout.screenPadding,
      marginTop: spacing('1'),
      marginBottom: spacing('4'),
      alignSelf: 'flex-start',
    },
    fullAmountText: {
      fontSize: typography.sizes.sm,
      fontFamily: typography.styles.rowLabel.fontFamily,
      color: colors.primary,
    },
    fieldSection: { marginHorizontal: layout.screenPadding, marginBottom: spacing('4') },
    datePickerBtn: {
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
  });
