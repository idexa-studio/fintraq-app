import { IconButton } from '@/src/components/ui/IconButton';
import { Screen } from '@/src/components/ui/Screen';
import { Button, Chip, FormField, LIST_ITEM_LEADING_SIZE, ListGroup, ListItem, SkeletonScreen } from '@/src/components/ui';
import { CalendarBlankIcon } from '@/src/components/ui/icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckmarkCircle01Icon, Delete01Icon, Coins02Icon } from '@hugeicons/core-free-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ui/Text';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { PersonAvatar } from '@/src/components/ui/PersonAvatar';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { useCategories } from '@/src/features/categories/hooks/categories';
import { TransactionAccountPicker } from '@/src/features/transactions/components/TransactionAccountPicker';
import { TransactionAmountInput } from '@/src/features/transactions/components/TransactionAmountInput';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { usePremium } from '@/src/providers/PremiumProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { toErrorMessage } from '@/src/utils/errors';
import { LoanReminderSection } from '@/src/features/loans/components/LoanReminderSection';
import { LoanStatusBadge } from '@/src/features/loans/components/LoanStatusBadge';
import { RepaymentRow } from '@/src/features/loans/components/RepaymentRow';
import { useAddRepayment, useDeleteLoan, useLoanRepayments, useLoanWithStats, useMarkLoanRepaid } from '@/src/features/loans/hooks/loans';
import { useLoanReminders } from '@/src/features/loans/hooks/useLoanReminders';
import { useTranslation } from 'react-i18next';
import { alpha } from '@/src/theme/tokens';

const parseAmount = (raw: string) => {
  const n = parseFloat(raw.replace(',', '.').replace(/[^0-9.]/g, ''));
  return isFinite(n) ? n : 0;
};

export const LoanDetailScreen = React.memo(function LoanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const loanId = Number(id);
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;
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
      showAlert({ title: t('loans.invalidAmount'), message: t('loans.invalidAmountMessage'), type: 'warning' });
      return;
    }
    if (amount > loan.outstanding) {
      showAlert({
        title: t('loans.overpayment'),
        message: t('loans.overpaymentMessage', { amount: loan.outstanding.toFixed(2), currency: loan.currency }),
        type: 'warning',
      });
      return;
    }
    if (!effectiveRepayAccountId) {
      showAlert({ title: t('loans.noAccount'), message: t('loans.noAccountMessage'), type: 'warning' });
      return;
    }
    if (!defaultCategoryId) {
      showAlert({ title: t('loans.noCategory'), message: t('loans.noCategoryMessage'), type: 'warning' });
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
          title: t('loans.fullyRepaid'),
          message: t('loans.settledMessage', { name: loan.personName ?? t('loans.thisLoan') }),
          type: 'success',
        });
      }
    } catch (e) {
      showAlert({
        title: t('loans.error'),
        message: toErrorMessage(e, t('loans.repayFailed')),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [loan, isSubmitting, repayAmount, effectiveRepayAccountId, defaultCategoryId, repayDate, repayNote, addRepayment, cancelAllLoanReminders, showAlert, t]);

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
      <Screen header={{ title: t('loans.loan'), showBack: true }} variant="fixed" edges={['top', 'right', 'bottom', 'left']}>
        <SkeletonScreen />
      </Screen>
    );
  }

  const personColor = loan.personColor != null ? colorNumberToHex(loan.personColor) : colors.textMuted;
  const personName = loan.personName ?? (loan.type === 'lend' ? t('loans.unknown') : t('loans.unnamedSource'));
  const pct = loan.principal > 0 ? Math.round((loan.repaid / loan.principal) * 100) : 0;

  return (
    <Screen header={{ title: loan.type === 'lend' ? t('loans.lentToName', { name: personName }) : t('loans.borrowedFromName', { name: personName }), showBack: true, rightAction:
          <View style={styles.headerActions}>
            <IconButton icon={Delete01Icon} variant="danger" onPress={() => setShowDeleteConfirm(true)} accessibilityLabel={t('common.delete')} />
          </View>
         }} variant="fixed" edges={['top']}>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero Card styled like Account detail hero */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface }]}>
          <View style={styles.heroTop}>
            <PersonAvatar name={personName} color={personColor} size={56} variant="subtle" />
            <View style={styles.heroMeta}>
              <Text style={styles.heroName} numberOfLines={1}>{personName}</Text>
              <View style={styles.heroBadgeRow}>
                <View style={[styles.typeBadge, { backgroundColor: alpha(personColor, 'subtle') }]}>
                  <Text style={[styles.typeBadgeText, { color: personColor }]}>
                    {loan.type === 'lend' ? t('loans.lentOut') : t('loans.borrowed')}
                  </Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: alpha(colors.text, 'faint') }]}>
                  <Text style={[styles.typeBadgeText, { color: colors.textMuted }]}>{loan.accountName}</Text>
                </View>
              </View>
            </View>
            <LoanStatusBadge status={loan.computedStatus} />
          </View>

          <Text style={styles.balanceLabel}>{t('loans.outstandingBalance')}</Text>
          <MoneyText
            amount={loan.outstanding}
            currency={loan.currency}
            type={loan.type === 'lend' ? 'CR' : 'DR'}
            weight="bold"
            style={styles.balance}
          />

          {/* Stats tiles */}
          <View style={styles.statsRow}>
            <View style={[styles.statTile, { backgroundColor: alpha(colors.text, 'faint') }]}>
              <Text style={styles.statLabel}>{t('loans.principal')}</Text>
              <MoneyText amount={loan.principal} currency={loan.currency} type="NONE" weight="semibold" compact style={styles.statValue} />
            </View>
            <View style={[styles.statTile, { backgroundColor: alpha(colors.success, 'subtle') }]}>
              <Text style={[styles.statLabel, { color: colors.success }]}>{t('loans.repaid')}</Text>
              <MoneyText amount={loan.repaid} currency={loan.currency} type="NONE" weight="semibold" compact style={[styles.statValue, { color: colors.success }]} />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.pctRow}>
            <Text style={styles.pctText}>{t('loans.repaidPct', { pct })}</Text>
            {loan.dueDate && (
              <Text style={[styles.pctText, loan.computedStatus === 'overdue' && { color: colors.danger }]}>
                {t('loans.due', { date: format(new Date(loan.dueDate), 'MMM d, yyyy') })}
              </Text>
            )}
          </View>
        </View>

        {/* Actions */}
        {loan.computedStatus !== 'repaid' && (
          <View style={styles.actionsRow}>
            <Button title={t('loans.repay')} icon={Coins02Icon} onPress={handleRepayOpen} style={styles.action} />
            <Button title={t('loans.markRepaid')} icon={CheckmarkCircle01Icon} variant="tonal" onPress={handleMarkRepaid} style={styles.action} />
          </View>
        )}

        {/* Timeline */}
        {sortedRepayments.length > 0 && (
          <View style={styles.timelineSection}>
            <Text style={styles.sectionLabel}>
              {t('loans.history')}
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
              {t('loans.note')}
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
        <Screen
          header={{ title: t('loans.recordRepayment'), showBack: true, onBack: () => setShowRepayModal(false) }}
          edgeToEdge
          keyboardAvoiding
          footer={
            <Button
              title={t('loans.recordRepayment')}
              onPress={handleRepaySubmit}
              disabled={!canSubmitRepay}
              isLoading={isSubmitting}
              size="lg"
              fullWidth
            />
          }
        >
          {/* Person (locked) — only shown when a person is linked */}
          {loan.personId != null ? (
            <View style={styles.padded}>
              <ListGroup>
                <ListItem
                  leading={<PersonAvatar name={personName} color={personColor} size={LIST_ITEM_LEADING_SIZE} />}
                  title={personName}
                  subtitle={t('loans.outstandingAmount', { amount: `${loan.outstanding.toFixed(2)} ${loan.currency}` })}
                />
              </ListGroup>
            </View>
          ) : null}

          <View style={styles.top}>
            <TransactionAmountInput
              value={repayAmount}
              onChange={setRepayAmount}
              currency={loan.currency}
            />
            <View style={[styles.padded, styles.amountMeta]}>
              {parsedAmountVal > loan.outstanding ? (
                <Text variant="caption" tone="danger">
                  {t('loans.exceedsOutstanding', { amount: `${loan.outstanding.toFixed(2)} ${loan.currency}` })}
                </Text>
              ) : null}
              {loan.outstanding > 0 ? (
                <Chip
                  label={t('loans.fullAmount', { amount: `${loan.outstanding.toFixed(2)} ${loan.currency}` })}
                  onPress={() => setRepayAmount(loan.outstanding.toFixed(2))}
                />
              ) : null}
            </View>
          </View>

          <TransactionAccountPicker
            accounts={sameCurrencyAccounts}
            selectedId={effectiveRepayAccountId}
            onSelect={setRepayAccountId}
            label={loan.type === 'lend' ? t('loans.receivedInto') : t('loans.sentFrom')}
          />

          <View style={styles.padded}>
            <ListGroup>
              <ListItem
                icon={CalendarBlankIcon}
                iconColor={colors.primaryInk}
                title={t('loans.date')}
                value={format(repayDate, 'MMM d, yyyy')}
                onPress={() => setShowDatePicker(true)}
              />
            </ListGroup>
          </View>

          <View style={styles.padded}>
            <ListGroup insetDividers={false}>
              <FormField
                label={t('loans.note')}
                value={repayNote}
                onChangeText={setRepayNote}
                placeholder={t('loans.optionalNote')}
                multiline
                maxLength={200}
              />
            </ListGroup>
          </View>

          {showDatePicker ? (
            <DateTimePicker
              value={repayDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          ) : null}
        </Screen>
      </Modal>

      {/* Prebuilt Dialog alerts */}
      <ConfirmDialog
        destructive
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('loans.deleteTitle')}
        message={loan.personName ? t('loans.deleteWithPersonMessage', { name: loan.personName }) : t('loans.deleteMessage')}
        confirmLabel={t('loans.delete')}
        onConfirm={handleDelete}
        isLoading={deleteLoan.isPending}
      />

      <ConfirmDialog
        visible={showMarkRepaidConfirm}
        onClose={() => setShowMarkRepaidConfirm(false)}
        title={t('loans.markRepaidTitle')}
        message={t('loans.markRepaidMessage')}
        confirmLabel={t('loans.markRepaid')}
        onConfirm={handleMarkRepaidConfirm}
        isLoading={markRepaid.isPending}
      />
    </Screen>
  );
});

const createStyles = ({ colors, spacing, radius, layout, typography, sizes }: ThemeContextType) =>
  StyleSheet.create({
    scroll: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: spacing('12'),
    },
    headerActions: { flexDirection: 'row', gap: spacing('2') },
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
      ...typography.metrics.xl,
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
      ...typography.metrics.xs,
    },
    balanceLabel: {
      fontFamily: typography.styles.rowMeta.fontFamily,
      ...typography.metrics.xs,
      color: colors.textMuted,
      marginBottom: spacing('1'),
    },
    balance: {
      ...typography.metrics.display,
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
      ...typography.metrics.xs,
      color: colors.textMuted,
    },
    statValue: {
      ...typography.metrics.md,
      fontFamily: typography.styles.sectionLabel.fontFamily,
      color: colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: alpha(colors.text, 'faint'),
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
      ...typography.metrics.xs,
      color: colors.textMuted,
    },
    actionsRow: { flexDirection: 'row', gap: spacing('3'), marginBottom: spacing('4') },
    action: { flex: 1 },
    padded: { paddingHorizontal: layout.screenPadding },
    top: { gap: spacing('1') },
    amountMeta: { gap: spacing('2'), alignItems: 'flex-start' },
    timelineSection: { marginBottom: spacing('2') },
    sectionLabel: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      ...typography.metrics.xs,
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
      ...typography.metrics.md,
      fontFamily: typography.styles.cardBody.fontFamily,
      color: colors.text,
    },
    // Modal styles
  });
