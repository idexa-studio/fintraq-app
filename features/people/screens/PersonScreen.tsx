import {
  Button, Card, CardActions, Dialog, Emblem, EmptyState, Header, IconButton, IconCircle, ListGroup, ListRow, Message, Money, Screen, Section, Select, Sheet, Skeleton, Stat, Text,
  useStyles, useTheme, useToast,
} from '@/design';
import type { Theme } from '@/design';
import { useLoansByPerson } from '@/features/loans';
import { useDeletePerson, usePersonWithStats } from '@/features/people/hooks/people';
import { initialsOf, standingOf } from '@/features/people/person-form';
import { useSettings } from '@/features/settings';
import { TransactionRow, useTransactions } from '@/features/transactions';
import { sortCurrenciesWithDefault } from '@/shared/currency/currencies';
import { formatDate, parseDateKey } from '@/shared/date/date';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

const RECENT_COUNT = 10;
/** Enough of their history to know every currency that has passed between you. */
const HISTORY = 50;

/** One person: where things stand between you, how to reach them, open loans, and what you recorded together. */
export function PersonScreen() {
  const { t } = useTranslation('people');
  const { size } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();
  const { profile } = useSettings();
  const params = useLocalSearchParams<{ id: string }>();
  const parsed = Number(params.id);
  const id = Number.isFinite(parsed) ? parsed : -1;

  const { data: transactions } = useTransactions(HISTORY, { personIds: [id] });
  const { data: loans } = useLoansByPerson(id);
  const remove = useDeletePerson();

  // The currencies that have passed between you, the default first; with none yet, the default alone.
  const currencies = useMemo(() => {
    const used = [...new Set((transactions ?? []).map((tx) => tx.account.currency))];
    return sortCurrenciesWithDefault(used.length > 0 ? used : [profile.defaultCurrency], profile.defaultCurrency);
  }, [transactions, profile.defaultCurrency]);
  const [chosen, setChosen] = useState<string | null>(null);
  const currency = chosen && currencies.includes(chosen) ? chosen : currencies[0]!;

  const { data: person, isPending } = usePersonWithStats(id, currency);

  const [managing, setManaging] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/people'));

  if (isPending) {
    return (
      <Screen header={<Header onBack={back} backLabel={t('back')} />}>
        <Skeleton height={size.row * 3} />
        <Skeleton height={size.row * 3} />
      </Screen>
    );
  }

  if (!person) {
    return (
      <Screen scroll={false} header={<Header onBack={back} backLabel={t('back')} />}>
        <View style={styles.centre}>
          <Message illustration={<Emblem icon="user" />} title={t('person.notFound')} />
        </View>
      </Screen>
    );
  }

  const net = person.totalReceived - person.totalSpent;
  const standing = standingOf(net);
  const about = [person.designation, person.company].filter(Boolean).join(' · ');
  const recent = (transactions ?? []).filter((tx) => tx.account.currency === currency).slice(0, RECENT_COUNT);
  const openLoans = (loans ?? []).filter((loan) => loan.computedStatus !== 'repaid');
  const reach = [
    person.phone ? { label: t('person.call'), onPress: () => void Linking.openURL(`tel:${person.phone}`) } : null,
    person.email ? { label: t('person.email'), onPress: () => void Linking.openURL(`mailto:${person.email}`) } : null,
  ].filter((action): action is NonNullable<typeof action> => action !== null);

  const confirmDelete = async () => {
    try {
      await remove.mutateAsync(person.id);
      setConfirming(false);
      toast.show({ message: t('person.deleted', { name: person.name }) });
      back();
    } catch {
      setConfirming(false);
      setFailed(true);
    }
  };

  return (
    <Screen header={<Header title={person.name} onBack={back} backLabel={t('back')} right={<IconButton icon="dots-three" onPress={() => setManaging(true)} accessibilityLabel={t('person.manage')} />} />}>
      <Card padded={false}>
        <View style={styles.summary}>
          <View style={styles.identity}>
            <IconCircle initials={initialsOf(person.name)} color={colorNumberToHex(person.color)} />
            <View style={styles.fill}>
              <Text variant="bodyStrong">{t(`standing.${standing}`)}</Text>
              {about ? <Text variant="callout" tone="muted">{about}</Text> : null}
            </View>
            {currencies.length > 1 ? <Select options={currencies.map((code) => ({ key: code, label: code }))} value={currency} onChange={setChosen} accessibilityLabel={t('currency')} /> : null}
          </View>
          <Money value={formatCurrency(Math.abs(net), currency)} variant="amountHero" tone={standing === 'owesYou' ? 'positive' : 'default'} />
          <View style={styles.stats}>
            <Stat label={t('person.spent')} value={formatCurrency(person.totalSpent, currency)} />
            <Stat label={t('person.received')} value={formatCurrency(person.totalReceived, currency)} tone="positive" />
          </View>
        </View>
        {reach.length > 0 ? <CardActions actions={reach} /> : null}
      </Card>

      {openLoans.length > 0 ? (
        <Section title={t('person.loans')}>
          <ListGroup>
            {openLoans.map((loan) => (
              <ListRow
                key={loan.id}
                icon="hand-coins"
                strong
                title={loan.type === 'lend' ? t('person.lent') : t('person.borrowed')}
                subtitle={loan.dueDate ? t('person.due', { date: formatDate(parseDateKey(loan.dueDate), { day: 'numeric', month: 'short', year: 'numeric' }) }) : loan.accountName}
                value={formatCurrency(loan.outstanding, loan.currency)}
                valueTone={loan.type === 'lend' ? 'positive' : 'default'}
                onPress={() => router.push({ pathname: '/loans/[id]', params: { id: loan.id } })}
              />
            ))}
          </ListGroup>
        </Section>
      ) : null}

      <Section title={t('person.recent')} actionLabel={recent.length ? t('person.seeAll') : undefined} onAction={() => router.push({ pathname: '/activity', params: { personId: person.id } })}>
        {!transactions ? (
          <Skeleton height={size.row * 2} />
        ) : recent.length === 0 ? (
          <EmptyState compact icon="receipt" title={t('person.noActivityTitle')} body={t('person.noActivityBody')} />
        ) : (
          <ListGroup>
            {recent.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} when="day" onPress={(tx) => router.push({ pathname: '/transactions/[id]', params: { id: tx.id } })} />
            ))}
          </ListGroup>
        )}
      </Section>

      <Sheet visible={managing} onClose={() => setManaging(false)} title={person.name}>
        <ListGroup>
          <ListRow icon="pencil" title={t('person.edit')} onPress={() => { setManaging(false); router.push({ pathname: '/people/[id]/edit', params: { id: person.id } }); }} />
          <ListRow icon="trash" title={t('person.delete')} destructive onPress={() => { setManaging(false); setConfirming(true); }} trailing={<View />} />
        </ListGroup>
      </Sheet>

      <Dialog visible={confirming} onRequestClose={() => setConfirming(false)} title={t('person.deleteTitle', { name: person.name })} body={t('person.deleteBody')}>
        <Button label={t('person.deleteConfirm')} variant="danger" onPress={confirmDelete} loading={remove.isPending} />
        <Button label={t('person.deleteCancel')} variant="secondary" onPress={() => setConfirming(false)} />
      </Dialog>
      <Dialog visible={failed} onRequestClose={() => setFailed(false)} title={t('person.failed')} body={t('person.failedBody')}>
        <Button label={t('person.ok')} onPress={() => setFailed(false)} />
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
