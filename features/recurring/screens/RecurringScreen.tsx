import type { TransactionListItem } from '@/data/repositories/transactions';
import {
  Badge, Button, Card, CardActions, Column, Columns, DetailRow, Dialog, Emblem, Header, IconButton, IconCircle, ListGroup, ListRow, Message, Money, Notice, Screen, Section, Sheet, Skeleton, Text,
  resolveIcon, useTheme, useToast,
} from '@/design';
import { RuleMark } from '@/features/recurring/components/RuleMark';
import { useDeleteRecurring, useMadeBy, usePauseRecurring, useRecurringRule } from '@/features/recurring/hooks/recurring';
import { useRepeatWords } from '@/features/recurring/hooks/useRepeatWords';
import { stateOf } from '@/features/recurring/recurring-view';
import { resumedNextDue, stoppedBecause } from '@/shared/calc/recurrence';
import { dayLabel, getLocalISOString } from '@/shared/date/date';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency, signedAmount } from '@/shared/format/money';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/** How many of the transactions it made the page lists, newest first. */
const SHOWN = 12;

/**
 * One repeating item: what it makes and when, with Pause and Change on its card, then the
 * transactions it has made. Delete is in its menu, and keeps those transactions.
 */
export function RecurringScreen() {
  const { t } = useTranslation(['recurring', 'common', 'transactions']);
  const { size, space } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const words = useRepeatWords();
  const params = useLocalSearchParams<{ id: string }>();
  const parsed = Number(params.id);
  const id = Number.isFinite(parsed) ? parsed : -1;

  const { data: rule, isPending } = useRecurringRule(id);
  const { data: made } = useMadeBy(rule ? rule.id : null, SHOWN);
  const pause = usePauseRecurring();
  const remove = useDeleteRecurring();
  const [managing, setManaging] = useState(false);
  const [asking, setAsking] = useState(false);
  const [failed, setFailed] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/plan'));
  const menu = <IconButton icon="dots-three" onPress={() => setManaging(true)} accessibilityLabel={t('item.manage')} />;

  if (isPending) {
    return (
      <Screen header={<Header onBack={back} backLabel={t('item.back')} />}>
        <Skeleton height={size.row * 4} />
        <Skeleton height={size.row * 3} />
      </Screen>
    );
  }

  if (!rule) {
    return (
      <Screen scroll={false} header={<Header onBack={back} backLabel={t('item.back')} />}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Message illustration={<Emblem icon="repeat" color="lilac" />} title={t('item.notFound')} />
        </View>
      </Screen>
    );
  }

  const state = stateOf(rule);
  const change = () => router.push({ pathname: '/recurring/[id]/edit', params: { id: rule.id } });
  const togglePause = async () => {
    try {
      const resuming = rule.paused;
      await pause.mutateAsync({ rule, paused: !resuming });
      toast.show({ message: resuming ? t('item.resumed', { date: words.day(resumedNextDue(rule, getLocalISOString())) }) : t('item.paused') });
    } catch {
      setFailed(true);
    }
  };
  const confirmDelete = async () => {
    try {
      await remove.mutateAsync(rule.id);
      setAsking(false);
      toast.show({ message: t('item.deleted') });
      back();
    } catch {
      setAsking(false);
      setFailed(true);
    }
  };

  const where = rule.type === 'TR' && rule.account && rule.toAccount
    ? t('transactions:transferRoute', { from: rule.account.name, to: rule.toAccount.name })
    : rule.account?.name;
  const next = state === 'running' ? words.day(rule.nextDue) : state === 'paused' ? t('item.nextPaused') : state === 'ended' ? t('item.nextEnded') : t('item.nextStopped');
  const rows = (made ?? []).slice(0, SHOWN);
  const madeRow = (tx: TransactionListItem) => (
    <ListRow
      key={tx.id}
      leading={<IconCircle icon={tx.type === 'TR' ? 'arrows-left-right' : resolveIcon(tx.category.icon, 'tag')} color={colorNumberToHex(tx.category.color)} />}
      strong
      oneLine
      title={tx.note.trim() || tx.category.name}
      subtitle={`${dayLabel(new Date(tx.datetime), t('common:today'), t('common:yesterday'))} · ${tx.account.name}`}
      value={signedAmount(tx)}
      valueTone={tx.type === 'CR' ? 'positive' : 'default'}
      onPress={() => router.push({ pathname: '/transactions/[id]', params: { id: tx.id } })}
    />
  );

  return (
    <Screen header={<Header onBack={back} backLabel={t('item.back')} right={menu} />}>
      <Columns>
        <Column>
          {/* Something it points at was deleted: it says what, and the way to carry on. */}
          {state === 'stopped' ? <Notice tone="warning" title={t('item.stopped')} body={`${t(`row.stoppedBecause.${stoppedBecause(rule)!}`)}. ${t('item.stoppedBody')}`} linkLabel={t('item.change')} onLink={change} /> : null}
          {state === 'ended' ? <Notice title={t('item.ended')} linkLabel={t('item.change')} onLink={change} /> : null}

          <Card padded={false}>
            <View style={{ padding: size.cardPadding, gap: space.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <RuleMark rule={rule} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{words.name(rule)}</Text>
                  <Text variant="callout" tone="muted">{where ? `${t(`item.kind.${rule.type}`)} · ${where}` : t(`item.kind.${rule.type}`)}</Text>
                </View>
                {state === 'running' ? null : <Badge label={t(`row.${state}`)} tone={state === 'stopped' ? 'danger' : 'neutral'} />}
              </View>
              <Money value={formatCurrency(rule.amount, rule.account?.currency ?? '')} variant="amountHero" />
            </View>
            {/* Detail rows carry the card's own inset, so they sit straight in the unpadded card. */}
            <DetailRow label={t('item.howOften')} value={words.howOften(rule)} />
            <DetailRow label={t('item.next')} value={next} />
            <DetailRow label={t('item.onItsDay')} value={rule.mode === 'add' ? t('item.addedItself') : t('item.askedFirst')} />
            <DetailRow label={t('item.ends')} value={words.ends(rule)} />
            <CardActions
              actions={[
                // Pausing means nothing to an item that cannot run: the notice above says why.
                { label: rule.paused ? t('item.resume') : t('item.pause'), onPress: () => void togglePause(), disabled: state === 'stopped' || state === 'ended' || pause.isPending },
                { label: t('item.change'), onPress: change },
              ]}
            />
          </Card>
        </Column>
        <Column>
          <Section title={t('item.made')} hint={rows.length ? t('item.madeHint') : undefined}>
            {rows.length > 0 ? <ListGroup>{rows.map(madeRow)}</ListGroup> : <Text variant="callout" tone="muted">{t('item.nothingMade')}</Text>}
          </Section>
        </Column>
      </Columns>

      <Sheet visible={managing} onClose={() => setManaging(false)} title={t('item.manage')}>
        <ListGroup>
          <ListRow icon="pencil-simple" title={t('item.change')} onPress={() => { setManaging(false); change(); }} />
          <ListRow icon="trash" title={t('item.delete')} destructive onPress={() => { setManaging(false); setAsking(true); }} trailing={<View />} />
        </ListGroup>
      </Sheet>
      <Dialog visible={asking} onRequestClose={() => setAsking(false)} title={t('item.deleteTitle')} body={t('item.deleteBody')}>
        <Button label={t('item.deleteConfirm')} variant="danger" loading={remove.isPending} onPress={confirmDelete} />
        <Button label={t('item.keep')} variant="secondary" onPress={() => setAsking(false)} />
      </Dialog>
      <Dialog visible={failed} onRequestClose={() => setFailed(false)} title={t('item.failed')} body={t('item.failedBody')}>
        <Button label={t('item.ok')} onPress={() => setFailed(false)} />
      </Dialog>
    </Screen>
  );
}
