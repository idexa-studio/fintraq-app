import { FormBlock, FieldStack, Button, Calendar, Dialog, Emblem, Header, IconButton, ListGroup, Message, Screen, Sheet, Skeleton, Text, TextField, useStyles, useTheme, useToast } from '@/design';
import type { Theme } from '@/design';
import { useLoanWithStats, useUpdateLoan } from '@/features/loans/hooks/loans';
import { NOTE_MAX } from '@/features/loans/loan-rules';
import { useLeaveGuard } from '@/features/shell';
import { formatDate, getLocalISOString, parseDateKey } from '@/shared/date/date';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * Changing what can change about a loan once it is made: when it is due and its note. The amount,
 * the person and the account are the record of what happened, and stay.
 */
export function LoanEditScreen({ loanId }: { loanId: number }) {
  const { t } = useTranslation(['loans', 'common']);
  const { size } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();
  const { data: loan, isPending } = useLoanWithStats(loanId);
  const update = useUpdateLoan();

  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [note, setNote] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [picking, setPicking] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!loan || loaded) return;
    setDueDate(loan.dueDate ? parseDateKey(loan.dueDate) : null);
    setNote(loan.note);
    setLoaded(true);
  }, [loan, loaded]);

  const savedDue = loan?.dueDate ? loan.dueDate.slice(0, 10) : null;
  const due = dueDate ? getLocalISOString(dueDate) : null;
  const changed = loaded && !!loan && (due !== savedDue || note.trim() !== loan.note);
  const guard = useLeaveGuard(changed);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/plan'));
  const header = <Header task title={t('edit.title')} onClose={close} closeLabel={t('close')} />;

  if (isPending) {
    return (
      <Screen sheet header={header}>
        <Skeleton height={size.row * 2} />
      </Screen>
    );
  }
  if (!loan) {
    return (
      <Screen sheet scroll={false} header={header}>
        <View style={styles.centre}>
          <Message illustration={<Emblem icon="hand-coins" color="orange" />} title={t('loan.notFound')} />
        </View>
      </Screen>
    );
  }

  const today = new Date();
  const save = async () => {
    try {
      await update.mutateAsync({ id: loan.id, data: { dueDate: due, note: note.trim() } });
      guard.release();
      toast.show({ message: t('edit.saved') });
      // Leaves on the next tick, once the unsaved-input guard is off.
      setTimeout(close, 0);
    } catch {
      setFailed(true);
    }
  };

  return (
    <Screen
      sheet
      keyboardAware
      header={header}
      footer={
        <>
          {changed ? null : <Text variant="callout" tone="muted" align="center">{t('edit.unchanged')}</Text>}
          <Button label={t('edit.save')} onPress={save} disabled={!changed} loading={update.isPending} />
        </>
      }
    >
      <FormBlock label={t('form.details')}>
        <ListGroup>
          <FieldStack padded>
            <View style={styles.due}>
              <View style={styles.fill}>
                <TextField label={t('form.due')} value={dueDate ? formatDate(dueDate, { day: 'numeric', month: 'short', year: 'numeric' }) : t('form.noDue')} onPress={() => setPicking(true)} />
              </View>
              {dueDate ? <IconButton icon="x" onPress={() => setDueDate(null)} accessibilityLabel={t('form.clearDue')} /> : <IconButton icon="calendar" onPress={() => setPicking(true)} accessibilityLabel={t('form.pickDue')} />}
            </View>
            <TextField label={t('form.note')} value={note} onChangeText={setNote} placeholder={t('form.noteOptional')} maxLength={NOTE_MAX} remaining={(count) => t('common:charactersLeft', { count })} />
          </FieldStack>
        </ListGroup>
      </FormBlock>

      <Sheet visible={picking} onClose={() => setPicking(false)} title={t('form.pickDue')}>
        {/* A due date is ahead of today; the day chosen closes the sheet. */}
        <Calendar value={dueDate && dueDate > today ? dueDate : today} min={today} onChange={(day) => { setDueDate(day); setPicking(false); }} />
      </Sheet>

      <Dialog visible={guard.asking} onRequestClose={guard.stay} title={t('form.discard.title')} body={t('form.discard.body')}>
        <Button label={t('form.discard.confirm')} variant="danger" onPress={guard.leave} />
        <Button label={t('form.discard.cancel')} variant="secondary" onPress={guard.stay} />
      </Dialog>
      <Dialog visible={failed} onRequestClose={() => setFailed(false)} title={t('form.saveFailed')} body={t('form.saveFailedBody')}>
        <Button label={t('form.ok')} onPress={() => setFailed(false)} />
      </Dialog>
    </Screen>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    centre: { flex: 1, justifyContent: 'center' },
    fill: { flex: 1 },
    due: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  });
