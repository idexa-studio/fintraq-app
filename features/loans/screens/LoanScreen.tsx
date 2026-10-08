import {
  Badge, Button, Card, CardActions, Dialog, Emblem, Header, IconButton, IconCircle, ListGroup, ListRow, Message, Money, ProgressBar, Screen, Section, Sheet, Skeleton, Text, Timeline,
  useStyles, useTheme, useToast,
} from '@/design';
import type { Theme, TimelineItem } from '@/design';
import type { LoanType } from '@/data/repositories/loans';
import { LoanReminders } from '@/features/loans/components/LoanReminders';
import { useDeleteLoan, useLoanRepayments, useLoanWithStats, useMarkLoanRepaid } from '@/features/loans/hooks/loans';
import { loanStory, repaidShare } from '@/features/loans/loan-rules';
import type { LoanEvent } from '@/features/loans/loan-rules';
import { initialsOf } from '@/features/people';
import { formatDate, parseDateKey } from '@/shared/date/date';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

const DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
const STATUS_TONE = { active: 'neutral', overdue: 'danger', repaid: 'accent' } as const;

/**
 * One loan, told from start to where it stands: the money going out or
 * coming in, each repayment, then what is left or that it is settled.
 */
export function LoanScreen() {
  const { t } = useTranslation('loans');
  const { size } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ id: string }>();
  const parsed = Number(params.id);
  const id = Number.isFinite(parsed) ? parsed : -1;

  const { data: loan, isPending } = useLoanWithStats(id);
  const { data: payments } = useLoanRepayments(id);
  const markRepaid = useMarkLoanRepaid();
  const remove = useDeleteLoan();

  const [managing, setManaging] = useState(false);
  const [asking, setAsking] = useState<'repaid' | 'delete' | null>(null);
  const [failed, setFailed] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/plan'));

  if (isPending) {
    return (
      <Screen header={<Header onBack={back} backLabel={t('back')} />}>
        <Skeleton height={size.row * 3} />
        <Skeleton height={size.row * 4} />
      </Screen>
    );
  }

  if (!loan) {
    return (
      <Screen scroll={false} header={<Header onBack={back} backLabel={t('back')} />}>
        <View style={styles.centre}>
          <Message illustration={<Emblem icon="hand-coins" color="pink" />} title={t('loan.notFound')} />
        </View>
      </Screen>
    );
  }

  const type = loan.type as LoanType;
  const open = loan.computedStatus !== 'repaid';
  const money = (amount: number) => formatCurrency(amount, loan.currency);
  const day = (stored: string) => formatDate(parseDateKey(stored.slice(0, 10)), DAY);
  const title = loan.personName ? t(`title.${type}`, { name: loan.personName }) : t(type === 'lend' ? 'title.lendNoName' : 'title.borrowNoName');

  const line = (event: LoanEvent): TimelineItem => {
    if (event.kind === 'settled') return { title: t('story.settled'), state: 'done' };
    if (event.kind === 'remaining') {
      return {
        title: t(`story.remaining.${type}`),
        subtitle: event.due ? t(event.overdue ? 'story.overdue' : 'story.due', { date: day(event.due) }) : t('story.noDue'),
        value: money(event.amount),
        state: 'current',
      };
    }
    return {
      title: t(`story.${event.kind}.${type}`),
      subtitle: t('story.when', { date: formatDate(new Date(event.at), DAY), account: event.account }),
      value: money(event.amount),
      state: 'done',
    };
  };

  const confirm = async () => {
    const what = asking;
    try {
      if (what === 'repaid') {
        await markRepaid.mutateAsync(loan.id);
        toast.show({ message: t('loan.markedRepaid') });
      } else if (what === 'delete') {
        await remove.mutateAsync(loan.id);
        toast.show({ message: t('loan.deleted') });
      }
      setAsking(null);
      if (what === 'delete') back();
    } catch {
      setAsking(null);
      setFailed(true);
    }
  };

  return (
    <Screen header={<Header title={title} onBack={back} backLabel={t('back')} right={<IconButton icon="dots-three" onPress={() => setManaging(true)} accessibilityLabel={t('loan.manage')} />} />}>
      <Card padded={false}>
        <View style={styles.summary}>
          <View style={styles.identity}>
            {loan.personName ? <IconCircle initials={initialsOf(loan.personName)} color={colorNumberToHex(loan.personColor ?? 0)} /> : <IconCircle icon="hand-coins" />}
            <View style={styles.fill}>
              <Text variant="bodyStrong">{open ? t(`loan.outstanding.${type}`) : t('loan.settled')}</Text>
              <Text variant="callout" tone="muted">{loan.accountName}</Text>
            </View>
            <Badge label={t(`status.${loan.computedStatus}`)} tone={STATUS_TONE[loan.computedStatus]} />
          </View>
          <Money value={money(open ? loan.outstanding : loan.principal)} variant="amountHero" tone={open && type === 'lend' ? 'positive' : 'default'} />
          <View style={styles.progress}>
            <ProgressBar value={repaidShare(loan)} accessibilityLabel={t('loan.progressLabel')} />
            <Text variant="callout" tone="muted">{t('loan.progress', { repaid: money(loan.repaid), total: money(loan.principal) })}</Text>
          </View>
        </View>
        {open ? <CardActions actions={[{ label: t('loan.repay'), onPress: () => router.push({ pathname: '/loans/[id]/repay', params: { id: loan.id } }) }]} /> : null}
      </Card>

      <Section title={t('loan.story')}>
        <Card>{payments ? <Timeline items={loanStory(loan, payments).map(line)} /> : <Skeleton height={size.row * 2} />}</Card>
      </Section>

      {open ? (
        <Section title={t('reminders.title')}>
          <LoanReminders loan={loan} />
        </Section>
      ) : null}

      {loan.note ? (
        <Section title={t('loan.note')}>
          <Card><Text variant="body">{loan.note}</Text></Card>
        </Section>
      ) : null}

      <Sheet visible={managing} onClose={() => setManaging(false)} title={t('loan.manage')}>
        <ListGroup>
          {open ? <ListRow icon="check-circle" title={t('loan.markRepaid')} subtitle={t('loan.markRepaidHint')} onPress={() => { setManaging(false); setAsking('repaid'); }} trailing={<View />} /> : null}
          <ListRow icon="pencil-simple" title={t('loan.edit')} subtitle={t('loan.editHint')} onPress={() => { setManaging(false); router.push({ pathname: '/loans/[id]/edit', params: { id: loan.id } }); }} />
          <ListRow icon="trash" title={t('loan.delete')} destructive onPress={() => { setManaging(false); setAsking('delete'); }} trailing={<View />} />
        </ListGroup>
      </Sheet>

      <Dialog visible={asking === 'repaid'} onRequestClose={() => setAsking(null)} title={t('loan.markRepaidTitle')} body={t('loan.markRepaidBody')}>
        <Button label={t('loan.markRepaidConfirm')} onPress={confirm} loading={markRepaid.isPending} />
        <Button label={t('loan.cancel')} variant="secondary" onPress={() => setAsking(null)} />
      </Dialog>
      <Dialog visible={asking === 'delete'} onRequestClose={() => setAsking(null)} title={t('loan.deleteTitle')} body={t('loan.deleteBody')}>
        <Button label={t('loan.deleteConfirm')} variant="danger" onPress={confirm} loading={remove.isPending} />
        <Button label={t('loan.cancel')} variant="secondary" onPress={() => setAsking(null)} />
      </Dialog>
      <Dialog visible={failed} onRequestClose={() => setFailed(false)} title={t('loan.failed')} body={t('loan.failedBody')}>
        <Button label={t('loan.ok')} onPress={() => setFailed(false)} />
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
    progress: { gap: space.sm },
  });
