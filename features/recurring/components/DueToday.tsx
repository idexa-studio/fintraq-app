import type { RecurringRuleView } from '@/data/repositories/recurring';
import { Button, Card, CardActions, Dialog, ListRow, Section, useTheme, useToast } from '@/design';
import { AddDueSheet } from '@/features/recurring/components/AddDueSheet';
import { RuleMark } from '@/features/recurring/components/RuleMark';
import { ruleAmount } from '@/features/recurring/components/RecurringRow';
import { useAddOccurrence, useRecurringRules, useSkipOccurrence, useToday } from '@/features/recurring/hooks/recurring';
import { useRepeatWords } from '@/features/recurring/hooks/useRepeatWords';
import type { Waiting } from '@/features/recurring/recurring-view';
import { waitingItems } from '@/features/recurring/recurring-view';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * Items asked about on their day, waiting on Home: Add records it (tap the row first to change the
 * amount), Skip lets this time pass. Each item offers its oldest day first, so none is passed over.
 * A day with nothing waiting shows nothing.
 */
export function DueToday() {
  const { t } = useTranslation('recurring');
  const { size } = useTheme();
  const toast = useToast();
  const words = useRepeatWords();
  const today = useToday();
  const { data: rules } = useRecurringRules();
  const add = useAddOccurrence();
  const skip = useSkipOccurrence();
  const waiting = useMemo(() => waitingItems(rules ?? [], today), [rules, today]);
  const [editing, setEditing] = useState<Waiting<RecurringRuleView> | null>(null);
  const [failed, setFailed] = useState(false);
  /** The item being added or skipped: its buttons wait until it is done. */
  const [busy, setBusy] = useState<number | null>(null);

  if (waiting.length === 0) return null;

  const record = async (work: Waiting<RecurringRuleView>, amount?: number) => {
    setBusy(work.rule.id);
    try {
      await add.mutateAsync({ work, amount });
      toast.show({ message: t('due.added') });
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };
  const pass = async (work: Waiting<RecurringRuleView>) => {
    setBusy(work.rule.id);
    try {
      await skip.mutateAsync(work);
      toast.show({ message: t('due.skipped') });
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  const line = (work: Waiting<RecurringRuleView>) => {
    if (work.count > 1) return t('due.since', { date: words.day(work.day), count: work.count });
    const where = work.rule.account?.name ?? '';
    return `${work.day === today ? t(`cadence.${work.rule.cadence}`) : words.day(work.day)} · ${where}`;
  };

  return (
    <Section title={t('due.title')} hint={t('due.hint')}>
      <View style={{ gap: size.cardGap }}>
        {waiting.map((work) => (
          <Card key={work.rule.id} padded={false}>
            <ListRow leading={<RuleMark rule={work.rule} />} strong title={words.name(work.rule)} subtitle={line(work)} value={ruleAmount(work.rule)} valueTone={work.rule.type === 'CR' ? 'positive' : 'default'} onPress={() => setEditing(work)} disabled={busy === work.rule.id} />
            <CardActions
              actions={[
                { label: t('due.skip'), onPress: () => void pass(work), disabled: busy === work.rule.id },
                { label: t('due.add'), onPress: () => void record(work), disabled: busy === work.rule.id },
              ]}
            />
          </Card>
        ))}
      </View>

      <AddDueSheet work={editing} onClose={() => setEditing(null)} onAdd={(work, amount) => { setEditing(null); void record(work, amount); }} />
      <Dialog visible={failed} onRequestClose={() => setFailed(false)} title={t('due.failed')} body={t('due.failedBody')}>
        <Button label={t('due.ok')} onPress={() => setFailed(false)} />
      </Dialog>
    </Section>
  );
}
