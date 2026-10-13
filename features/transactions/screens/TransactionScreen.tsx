import type { TransactionDetail } from '@/data/repositories/transactions';
import { Button, Dialog, Emblem, Header, IconCircle, ListGroup, ListRow, Message, Money, Receipt, ReceiptRule, Screen, Skeleton, Text, resolveIcon, useTheme, useToast } from '@/design';
import { accountTypeIcon } from '@/features/accounts';
import { signedAmount } from '@/features/transactions/components/TransactionRow';
import { useDeleteTransaction, useTransactionDetail } from '@/features/transactions/hooks/transactions';
import { kindOfType } from '@/features/transactions/transaction-form';
import { formatDate } from '@/shared/date/date';
import { colorNumberToHex } from '@/shared/format/color';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('');

/**
 * One transaction, as a receipt: what it was and how much on a slip with a
 * torn edge, then everything it touches as rows that lead there.
 */
export function TransactionScreen() {
  const { t } = useTranslation('transactions');
  const { space, size } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const transactionId = Number.parseInt(id ?? '', 10);
  const { data, isPending } = useTransactionDetail(Number.isFinite(transactionId) ? transactionId : null);
  const remove = useDeleteTransaction();
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);
  // Once deleted, the query returns nothing; keep showing the receipt while the sheet closes
  // instead of flashing "no longer exists".
  const [leaving, setLeaving] = useState<TransactionDetail | null>(null);
  const tx = data ?? leaving;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const header = (title?: string) => <Header task title={title} onClose={close} closeLabel={t('close')} />;

  if (isPending && !tx) {
    return (
      <Screen sheet header={header()}>
        <Skeleton height={size.row * 3} />
        <Skeleton height={size.row * 2} />
      </Screen>
    );
  }
  if (!tx) {
    return (
      <Screen sheet scroll={false} header={header()}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Message illustration={<Emblem icon="receipt" color="orange" />} title={t('notFound')} />
        </View>
      </Screen>
    );
  }

  const kind = kindOfType(tx.type);
  const transfer = tx.type === 'TR';
  const when = new Date(tx.datetime);
  const note = tx.note.trim();

  const confirmDelete = async () => {
    try {
      setLeaving(tx);
      await remove.mutateAsync(tx.id);
      setConfirming(false);
      toast.show({ message: t('detail.deleted') });
      close();
    } catch {
      setLeaving(null);
      setConfirming(false);
      setFailed(true);
    }
  };

  return (
    <Screen
      sheet
      header={header(t(`detail.title.${kind}`))}
      footer={
        <>
          <Button label={t('detail.edit')} variant="secondary" onPress={() => router.push({ pathname: '/transactions/[id]/edit', params: { id: tx.id } })} />
          <Button label={t('detail.delete')} variant="link" onPress={() => setConfirming(true)} />
        </>
      }
    >
      <Receipt>
        <View style={{ alignItems: 'center', gap: space.sm }}>
          <IconCircle icon={transfer ? 'arrows-left-right' : resolveIcon(tx.category.icon, 'tag')} color={colorNumberToHex(tx.category.color)} size={size.button} />
          <Text variant="title" align="center">{note || tx.category.name}</Text>
          <Money value={signedAmount(tx)} variant="amountHero" tone={tx.type === 'CR' ? 'positive' : 'default'} />
        </View>
        <ReceiptRule />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.lg }}>
          <Text variant="callout" tone="muted">{formatDate(when, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          <Text variant="calloutStrong">{formatDate(when, { hour: 'numeric', minute: '2-digit' })}</Text>
        </View>
      </Receipt>

      <ListGroup>
        <ListRow
          leading={<IconCircle icon={accountTypeIcon(tx.account.accountType)} color={colorNumberToHex(tx.account.color)} />}
          strong
          title={tx.account.name}
          subtitle={transfer ? t('detail.from') : t('detail.account')}
          onPress={() => router.push({ pathname: '/accounts/[id]', params: { id: tx.account.id } })}
        />
        {transfer && tx.toAccount ? (
          <ListRow
            leading={<IconCircle icon={accountTypeIcon(tx.toAccount.accountType)} color={colorNumberToHex(tx.toAccount.color)} />}
            strong
            title={tx.toAccount.name}
            subtitle={t('detail.to')}
            onPress={() => router.push({ pathname: '/accounts/[id]', params: { id: tx.toAccount?.id ?? tx.account.id } })}
          />
        ) : null}
        {transfer ? null : (
          <ListRow
            leading={<IconCircle icon={resolveIcon(tx.category.icon, 'tag')} color={colorNumberToHex(tx.category.color)} />}
            strong
            title={tx.category.name}
            subtitle={t('detail.category')}
            onPress={() => router.push({ pathname: '/activity', params: { categoryId: tx.category.id } })}
          />
        )}
        {tx.person ? (
          <ListRow
            leading={<IconCircle initials={initialsOf(tx.person.name)} color={colorNumberToHex(tx.person.color)} />}
            strong
            title={tx.person.name}
            subtitle={t('detail.person')}
            onPress={() => router.push({ pathname: '/people/[id]', params: { id: tx.person?.id ?? 0 } })}
          />
        ) : null}
        {tx.loan ? (
          <ListRow
            leading={<IconCircle icon="hand-coins" color="pink" />}
            strong
            title={tx.person ? t(tx.loan.type === 'lend' ? 'detail.lentTo' : 'detail.borrowedFrom', { name: tx.person.name }) : t('detail.loan')}
            subtitle={t('detail.loan')}
            onPress={() => router.push({ pathname: '/loans/[id]', params: { id: tx.loan?.id ?? 0 } })}
          />
        ) : null}
      </ListGroup>

      <Dialog visible={confirming} onRequestClose={() => setConfirming(false)} title={t('detail.deleteTitle')} body={t('detail.deleteBody')}>
        <Button label={t('detail.deleteConfirm')} variant="danger" loading={remove.isPending} onPress={confirmDelete} />
        <Button label={t('detail.keep')} variant="secondary" onPress={() => setConfirming(false)} />
      </Dialog>
      <Dialog visible={failed} onRequestClose={() => setFailed(false)} title={t('detail.deleteFailed')} body={t('detail.deleteFailedBody')}>
        <Button label={t('tryAgain')} onPress={() => setFailed(false)} />
      </Dialog>
    </Screen>
  );
}
