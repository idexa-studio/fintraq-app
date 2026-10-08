import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertDialog,
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  IconAvatar,
  IconButton,
  ListGroup,
  ListItem,
  MoneyText,
  PersonAvatar,
  Screen,
  SkeletonScreen,
  Text,
} from '@/src/components/ui';
import { useAlertDialog } from '@/src/hooks/useAlertDialog';
import type { TransactionDetail } from '@/data/repositories/transactions';
import { isLoanPrincipal } from '@/data/repositories/ledger';
import { useDeleteTransaction, useTransactionDetail } from '@/features/transactions';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { TransactionType } from '@/shared/types';
import { formatDate } from '@/shared/date/date';
import { colorNumberToHex } from '@/shared/format/color';
import { resolveAccountTypeIcon, resolveIcon } from '@/src/utils/icons';

const TYPE_LABEL_KEYS = {
  CR: 'transactions.income',
  DR: 'transactions.expense',
  TR: 'transactions.transfer',
} as const satisfies Record<TransactionType, string>;

/**
 * A receipt: the amount up top, then everything it touches as rows you can follow — the account,
 * the category's other transactions, the person.
 */
export const TransactionDetailScreen = React.memo(function TransactionDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const txId = Number(id);
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const { data, isLoading } = useTransactionDetail(txId);
  const deleteTx = useDeleteTransaction();
  const [isDeleteVisible, setDeleteVisible] = useState(false);
  const { showAlert, alertProps } = useAlertDialog();

  // While closing after a delete, the refetch returns nothing; keep showing the receipt instead of
  // flashing "not found" for a frame before the screen goes.
  const [leavingSnapshot, setLeavingSnapshot] = useState<TransactionDetail | null>(null);
  const tx = data ?? leavingSnapshot;

  const edit = useCallback(() => router.push(`/transactions/edit/${txId}`), [router, txId]);
  const confirmDelete = useCallback(async () => {
    try {
      setLeavingSnapshot(data ?? null);
      await deleteTx.mutateAsync(txId);
      setDeleteVisible(false);
      router.back();
    } catch {
      setLeavingSnapshot(null);
      setDeleteVisible(false);
      showAlert({ title: t('transactions.unableToDelete'), message: t('transactions.unableToDeleteMessage'), type: 'error' });
    }
  }, [data, deleteTx, txId, router, showAlert, t]);

  const title = t('transactions.detailTitle');

  if (isLoading) {
    return (
      <Screen header={{ title, showBack: true }} variant="fixed" edges={['top']}>
        <SkeletonScreen />
      </Screen>
    );
  }

  if (!tx) {
    return (
      <Screen header={{ title, showBack: true }} variant="fixed" edges={['top']}>
        <EmptyState icon="receipt" title={t('transactions.notFound')} />
      </Screen>
    );
  }

  const categoryColor = colorNumberToHex(tx.category.color);
  const categoryIcon = resolveIcon(tx.category.icon, 'tag');
  const typeColor = tx.type === 'CR' ? colors.success : tx.type === 'DR' ? colors.danger : colors.info;
  const note = tx.note?.trim();
  const when = new Date(tx.datetime);
  const isTransfer = tx.type === 'TR';
  const toAccount = isTransfer ? tx.toAccount : null;
  const { person, loan } = tx;
  const loanTitle = loan
    ? person
      ? t(loan.type === 'lend' ? 'loans.lentToName' : 'loans.borrowedFromName', { name: person.name })
      : t('loans.loan')
    : '';

  const headerActions = (
    <View style={styles.headerActions}>
      <IconButton icon="trash" variant="danger" onPress={() => setDeleteVisible(true)} accessibilityLabel={t('common.delete')} />
      <IconButton icon="pencil-simple" onPress={edit} accessibilityLabel={t('common.edit')} />
    </View>
  );

  return (
    <Screen header={{ title, showBack: true, rightAction: headerActions }} variant="fixed" edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <IconAvatar icon={categoryIcon} color={categoryColor} size={64} iconSize={28} />
          <Text variant="subheading" align="center" numberOfLines={2}>
            {note || tx.category.name}
          </Text>
          <MoneyText
            amount={tx.amount}
            currency={tx.account.currency}
            type={tx.type}
            weight="bold"
            style={styles.amount}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          />
          <View style={styles.badges}>
            <Badge label={t(TYPE_LABEL_KEYS[tx.type])} color={typeColor} />
            <Badge label={tx.account.currency} variant="muted" />
          </View>
        </View>

        <ListGroup>
          <ListItem
            icon="calendar-blank"
            iconColor={colors.textMuted}
            title={formatDate(when, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            subtitle={formatDate(when, { hour: 'numeric', minute: '2-digit' })}
          />
          <ListItem
            leading={<IconAvatar icon={resolveAccountTypeIcon(tx.account.accountType)} color={colorNumberToHex(tx.account.color)} size={40} />}
            title={tx.account.name}
            subtitle={isTransfer ? t('transactions.from') : t('transactions.account')}
            onPress={() => router.push(`/(main)/accounts/${tx.account.id}`)}
          />
          {toAccount ? (
            <ListItem
              leading={
                <IconAvatar
                  icon={resolveAccountTypeIcon(toAccount.accountType)}
                  color={colorNumberToHex(toAccount.color)}
                  size={40}
                />
              }
              title={toAccount.name}
              subtitle={t('transactions.to')}
              onPress={() => router.push(`/(main)/accounts/${toAccount.id}`)}
            />
          ) : null}
          <ListItem
            leading={<IconAvatar icon={categoryIcon} color={categoryColor} size={40} />}
            title={tx.category.name}
            subtitle={t('transactions.category')}
            onPress={() => router.push(`/transactions?categoryId=${tx.category.id}`)}
          />
          {person ? (
            <ListItem
              leading={<PersonAvatar name={person.name} color={colorNumberToHex(person.color)} size={40} />}
              title={person.name}
              subtitle={[person.designation, person.company].filter(Boolean).join(' · ') || t('transactions.person')}
              onPress={() => router.push(`/persons/${person.id}`)}
            />
          ) : null}
          {loan ? (
            <ListItem
              leading={<IconAvatar icon="hand-coins" color={colors.warning} size={40} />}
              title={loanTitle}
              subtitle={isLoanPrincipal(tx.type, loan.type) ? t('loans.loan') : t('transactions.loanRepayment')}
              onPress={() => router.push(`/(main)/loans/${loan.id}`)}
            />
          ) : null}
        </ListGroup>

        {note ? (
          <Card style={styles.note}>
            <View style={styles.noteLabel}>
              <IconAvatar icon="note" color={colors.textMuted} size={24} iconSize={12} />
              <Text variant="label" tone="muted">
                {t('transactions.note')}
              </Text>
            </View>
            <Text variant="body" selectable>
              {note}
            </Text>
          </Card>
        ) : null}

        <Text variant="caption" tone="muted" align="center">
          {t('transactions.addedOn', { date: formatDate(new Date(tx.createdAt), { day: 'numeric', month: 'short', year: 'numeric' }) })}
        </Text>
      </ScrollView>

      <ConfirmDialog
        destructive
        visible={isDeleteVisible}
        onClose={() => setDeleteVisible(false)}
        title={t('transactions.detailDeleteTitle')}
        message={t('transactions.detailDeleteMessage')}
        confirmLabel={t('transactions.delete')}
        onConfirm={confirmDelete}
        isLoading={deleteTx.isPending}
      />
      <AlertDialog {...alertProps} />
    </Screen>
  );
});

const createStyles = ({ spacing, layout, typography }: ThemeContextType, insets: EdgeInsets) =>
  StyleSheet.create({
    headerActions: { flexDirection: 'row', gap: spacing('2') },
    content: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: insets.bottom + spacing('8'),
      gap: spacing('4'),
    },
    hero: { alignItems: 'center', gap: spacing('2'), paddingVertical: spacing('4') },
    amount: { ...typography.metrics.jumbo, marginTop: spacing('1') },
    badges: { flexDirection: 'row', gap: spacing('1.5') },
    note: { gap: spacing('2') },
    noteLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
  });
