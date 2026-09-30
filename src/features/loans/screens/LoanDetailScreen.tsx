import { CheckmarkCircle01Icon, Coins02Icon, Delete01Icon, NoteIcon } from '@hugeicons/core-free-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AlertDialog, Button, Card, ConfirmDialog, IconAvatar, IconButton, ListGroup, Screen, SkeletonScreen, Text } from '@/src/components/ui';
import { LoanReminderSection } from '@/src/features/loans/components/LoanReminderSection';
import { LoanSummaryCard } from '@/src/features/loans/components/LoanSummaryCard';
import { RepaymentRow } from '@/src/features/loans/components/RepaymentRow';
import { RepaymentSheet } from '@/src/features/loans/components/RepaymentSheet';
import { useDeleteLoan, useLoanRepayments, useLoanWithStats, useMarkLoanRepaid } from '@/src/features/loans/hooks/loans';
import { useAlertDialog } from '@/src/hooks/useAlertDialog';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Dialog = 'repay' | 'delete' | 'markRepaid' | null;

/** A loan's balance and progress, the actions on it, then its history, reminders and note. */
export const LoanDetailScreen = React.memo(function LoanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const loanId = Number(id);
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: loan, isLoading } = useLoanWithStats(loanId);
  const { data: history = [] } = useLoanRepayments(loanId);
  const markRepaid = useMarkLoanRepaid();
  const deleteLoan = useDeleteLoan();
  const { showAlert, alertProps } = useAlertDialog();
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = useCallback(() => setDialog(null), []);

  const confirmMarkRepaid = useCallback(async () => {
    if (!loan) return;
    await markRepaid.mutateAsync(loan.id);
  }, [loan, markRepaid]);

  const confirmDelete = useCallback(async () => {
    if (!loan) return;
    await deleteLoan.mutateAsync(loan.id);
    router.back();
  }, [loan, deleteLoan, router]);

  if (isLoading || !loan) {
    return (
      <Screen header={{ title: t('loans.loan'), showBack: true }} variant="fixed" edges={['top']}>
        <SkeletonScreen />
      </Screen>
    );
  }

  const isLend = loan.type === 'lend';
  const isOpen = loan.computedStatus !== 'repaid';
  const personName = loan.personName ?? (isLend ? t('loans.unknown') : t('loans.unnamedSource'));

  return (
    <Screen
      header={{
        title: isLend ? t('loans.lentToName', { name: personName }) : t('loans.borrowedFromName', { name: personName }),
        showBack: true,
        rightAction: <IconButton icon={Delete01Icon} variant="danger" onPress={() => setDialog('delete')} accessibilityLabel={t('common.delete')} />,
      }}
      variant="fixed"
      edges={['top']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LoanSummaryCard loan={loan} personName={personName} />

        {isOpen ? (
          <View style={styles.actions}>
            <Button title={t('loans.repay')} icon={Coins02Icon} onPress={() => setDialog('repay')} style={styles.action} />
            <Button title={t('loans.markRepaid')} icon={CheckmarkCircle01Icon} variant="tonal" onPress={() => setDialog('markRepaid')} style={styles.action} />
          </View>
        ) : null}

        {history.length > 0 ? (
          // Newest first; the last row is the transaction that opened the loan.
          <ListGroup title={t('loans.history')}>
            {history.map((row, idx) => (
              <RepaymentRow key={row.id} row={row} loanType={isLend ? 'lend' : 'borrow'} isCreation={idx === history.length - 1} />
            ))}
          </ListGroup>
        ) : null}

        {isOpen ? <LoanReminderSection loan={loan} /> : null}

        {loan.note ? (
          <Card style={styles.note}>
            <View style={styles.noteLabel}>
              <IconAvatar icon={NoteIcon} color={colors.textMuted} size={24} iconSize={12} />
              <Text variant="label" tone="muted">
                {t('loans.note')}
              </Text>
            </View>
            <Text variant="body" selectable>
              {loan.note}
            </Text>
          </Card>
        ) : null}
      </ScrollView>

      <RepaymentSheet loan={loan} personName={personName} visible={dialog === 'repay'} onClose={close} showAlert={showAlert} />
      <ConfirmDialog
        destructive
        visible={dialog === 'delete'}
        onClose={close}
        title={t('loans.deleteTitle')}
        message={loan.personName ? t('loans.deleteWithPersonMessage', { name: loan.personName }) : t('loans.deleteMessage')}
        confirmLabel={t('loans.delete')}
        onConfirm={confirmDelete}
        isLoading={deleteLoan.isPending}
      />
      <ConfirmDialog
        visible={dialog === 'markRepaid'}
        onClose={close}
        title={t('loans.markRepaidTitle')}
        message={t('loans.markRepaidMessage')}
        confirmLabel={t('loans.markRepaid')}
        onConfirm={confirmMarkRepaid}
        isLoading={markRepaid.isPending}
      />
      <AlertDialog {...alertProps} />
    </Screen>
  );
});

const createStyles = ({ spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing('2'), paddingBottom: spacing('12'), gap: spacing('5') },
    actions: { flexDirection: 'row', gap: spacing('3') },
    action: { flex: 1 },
    note: { gap: spacing('2') },
    noteLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
  });
