import {
  Button, Card, CardActions, Dialog, Emblem, EmptyState, Header, IconButton, IconCircle, ListGroup, ListRow, Message, Money, Screen, Section, Sheet, Skeleton, Stat, Text,
  useStyles, useTheme, useToast,
} from '@/design';
import type { Theme } from '@/design';
import { accountTypeIcon } from '@/features/accounts/account-icons';
import { maskedNumber } from '@/features/accounts/account-form';
import { useAccount, useAccountUsage, useDeleteAccount, useSetDefaultAccount } from '@/features/accounts/hooks/accounts';
import { TransactionRow, useTransactions } from '@/features/transactions';
import { currencyName } from '@/shared/currency/currencies';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

const RECENT_COUNT = 10;

/** One account: what is in it, the two things done with it, and what was last recorded on it. */
export function AccountScreen() {
  const { t } = useTranslation(['accounts', 'common']);
  const { size } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);

  const { data: account, isPending } = useAccount(Number.isFinite(id) ? id : undefined);
  const { data: usage } = useAccountUsage(account?.id);
  const { data: recent } = useTransactions(RECENT_COUNT, { accountIds: [id] });
  const makeDefault = useSetDefaultAccount();
  const remove = useDeleteAccount();

  const [managing, setManaging] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/accounts'));

  if (isPending) {
    return (
      <Screen header={<Header onBack={back} backLabel={t('back')} />}>
        <Skeleton height={size.row * 3} />
        <Skeleton height={size.chip} width="40%" />
        <Skeleton height={size.row * 3} />
      </Screen>
    );
  }

  if (!account) {
    return (
      <Screen scroll={false} header={<Header onBack={back} backLabel={t('back')} />}>
        <View style={styles.centre}>
          <Message illustration={<Emblem icon="wallet" />} title={t('account.notFound')} />
        </View>
      </Screen>
    );
  }

  const add = (kind: 'expense' | 'transfer') => router.push({ pathname: '/add', params: { kind, accountId: account.id } });
  const about = [currencyName(account.currency), maskedNumber(account.accountNumber), account.isDefault ? t('default') : null].filter(Boolean).join(' · ');
  // An account with anything recorded on it stays: deleting it would take that history with it.
  const inUse = usage
    ? usage.transactions > 0
      ? t('account.inUse.transactions', { count: usage.transactions })
      : usage.loans > 0
        ? t('account.inUse.loans', { count: usage.loans })
        : null
    : null;

  const setDefault = async () => {
    setManaging(false);
    await makeDefault.mutateAsync(account.id).then(() => toast.show({ message: t('account.madeDefault', { name: account.name }) }), () => setFailed(true));
  };

  const confirmDelete = async () => {
    try {
      await remove.mutateAsync(account.id);
      setConfirming(false);
      toast.show({ message: t('account.deleted', { name: account.name }) });
      back();
    } catch {
      setConfirming(false);
      setFailed(true);
    }
  };

  return (
    <Screen header={<Header title={account.name} onBack={back} backLabel={t('back')} right={<IconButton icon="dots-three" onPress={() => setManaging(true)} accessibilityLabel={t('account.manage')} />} />}>
      <Card padded={false}>
        <View style={styles.summary}>
          <View style={styles.identity}>
            <IconCircle icon={accountTypeIcon(account.accountType)} color={colorNumberToHex(account.color)} />
            <View style={styles.fill}>
              {/* The name is the screen's title; the card says what kind of account it is. */}
              <Text variant="bodyStrong" numberOfLines={1}>{t(`common:accountTypes.${account.accountType ?? 'bank'}`)}</Text>
              <Text variant="callout" tone="muted">{about}</Text>
            </View>
          </View>
          <Money value={formatCurrency(account.balance, account.currency)} variant="amountHero" />
          <View style={styles.stats}>
            <Stat label={t('account.moneyIn')} value={formatCurrency(account.income, account.currency)} tone="positive" />
            <Stat label={t('account.moneyOut')} value={formatCurrency(account.expense, account.currency)} />
          </View>
        </View>
        <CardActions actions={[{ label: t('account.addTransaction'), onPress: () => add('expense') }, { label: t('account.transfer'), onPress: () => add('transfer') }]} />
      </Card>

      <Section title={t('account.recent')} actionLabel={recent?.length ? t('account.seeAll') : undefined} onAction={() => router.push({ pathname: '/activity', params: { accountId: account.id } })}>
        {!recent ? (
          <Skeleton height={size.row * 2} />
        ) : recent.length === 0 ? (
          <EmptyState compact icon="receipt" color="orange" title={t('account.noActivityTitle')} body={t('account.noActivityBody')} actionLabel={t('account.addTransaction')} onAction={() => add('expense')} />
        ) : (
          <ListGroup>
            {recent.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} when="day" onPress={(tx) => router.push({ pathname: '/transactions/[id]', params: { id: tx.id } })} />
            ))}
          </ListGroup>
        )}
      </Section>

      <Sheet visible={managing} onClose={() => setManaging(false)} title={t('account.manage')}>
        <ListGroup>
          <ListRow icon="pencil" title={t('account.edit')} onPress={() => { setManaging(false); router.push({ pathname: '/accounts/[id]/edit', params: { id: account.id } }); }} />
          <ListRow icon="star" title={t('account.makeDefault')} subtitle={account.isDefault ? t('account.isDefault') : t('account.makeDefaultHint')} disabled={account.isDefault} onPress={setDefault} />
          <ListRow icon="trash" title={t('account.delete')} subtitle={inUse ?? undefined} destructive={!inUse} disabled={!usage || !!inUse} onPress={() => { setManaging(false); setConfirming(true); }} />
        </ListGroup>
      </Sheet>

      <Dialog visible={confirming} onRequestClose={() => setConfirming(false)} title={t('account.deleteTitle', { name: account.name })} body={t('account.deleteBody')}>
        <Button label={t('account.deleteConfirm')} variant="danger" onPress={confirmDelete} loading={remove.isPending} />
        <Button label={t('account.deleteCancel')} variant="secondary" onPress={() => setConfirming(false)} />
      </Dialog>
      <Dialog visible={failed} onRequestClose={() => setFailed(false)} title={t('account.failed')} body={t('account.failedBody')}>
        <Button label={t('account.ok')} onPress={() => setFailed(false)} />
      </Dialog>
    </Screen>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    centre: { flex: 1, justifyContent: 'center' },
    fill: { flex: 1 },
    summary: { padding: size.cardPadding, gap: space.lg },
    identity: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    stats: { flexDirection: 'row', gap: space.lg },
  });
