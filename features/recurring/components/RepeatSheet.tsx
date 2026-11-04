import { Button, Calendar, FormBlock, Notice, Radio, Sheet, Text, TextField } from '@/design';
import type { RepeatDraft } from '@/features/recurring/repeat-draft';
import { MIN_TIMES, repeatBlocker } from '@/features/recurring/repeat-draft';
import { CADENCES, firstDue } from '@/shared/calc/recurrence';
import { parseDateKey } from '@/shared/date/date';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export type RepeatSheetProps = {
  visible: boolean;
  onClose: () => void;
  value: RepeatDraft;
  onDone: (draft: RepeatDraft) => void;
  /** The first day (YYYY-MM-DD): the transaction's day, or the item's next day when changing it. */
  firstDay: string;
  /** An item being changed cannot be set to Never: deleting it is on its page. */
  allowNever: boolean;
  /** Set when one more item would pass the free plan's limit: shown in place of the choices. */
  limit?: { count: number; keeps: number; onSeePro: () => void };
};

const DAY = 'yyyy-MM-dd';

/**
 * How a transaction repeats: how often, then (once it repeats) what happens on its day and when it
 * ends. Three questions of one kind, so one pattern: a label, then its choices. Chosen here and
 * kept only on Done, so closing the sheet leaves Repeat as it was.
 */
export function RepeatSheet({ visible, onClose, value, onDone, firstDay, allowNever, limit }: RepeatSheetProps) {
  const { t } = useTranslation('recurring');
  const [draft, setDraft] = useState(value);
  const [timesText, setTimesText] = useState(value.endTimes ? String(value.endTimes) : '');
  // Opened again: start from what is set now, not from what was left in it last time.
  const [shown, setShown] = useState(false);
  if (visible !== shown) {
    setShown(visible);
    if (visible) {
      setDraft(value);
      setTimesText(value.endTimes ? String(value.endTimes) : '');
    }
  }

  const set = (change: Partial<RepeatDraft>) => setDraft((current) => ({ ...current, ...change }));
  const blocker = repeatBlocker(draft, firstDay);
  // The end date is chosen from the day after the first; it opens on the next time it falls.
  const earliest = parseDateKey(firstDay);
  earliest.setDate(earliest.getDate() + 1);
  const shownEnd = parseDateKey(draft.endDate ?? (draft.cadence ? firstDue(firstDay, draft.cadence) : firstDay));

  if (limit && draft.cadence === null) {
    return (
      <Sheet visible={visible} onClose={onClose} title={t('sheet.title')}>
        <Notice title={t('sheet.limit.title', { count: limit.count })} body={t('sheet.limit.body', { count: limit.keeps })} linkLabel={t('sheet.limit.link')} onLink={limit.onSeePro} />
      </Sheet>
    );
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('sheet.title')}
      footer={
        <>
          {blocker ? <Text variant="callout" tone="muted" align="center">{t(`sheet.blocked.${blocker}`)}</Text> : null}
          <Button label={t('sheet.done')} disabled={!!blocker} onPress={() => { onDone(draft); onClose(); }} />
        </>
      }
    >
      <FormBlock label={t('sheet.howOften')}>
        {allowNever ? <Radio label={t('sheet.never')} selected={draft.cadence === null} onPress={() => set({ cadence: null })} /> : null}
        {CADENCES.map((cadence) => <Radio key={cadence} label={t(`cadence.${cadence}`)} selected={draft.cadence === cadence} onPress={() => set({ cadence })} />)}
      </FormBlock>
      {draft.cadence === null ? null : (
        <>
          <FormBlock label={t('sheet.onItsDay')}>
            <Radio label={t('sheet.askFirst')} selected={draft.mode === 'ask'} onPress={() => set({ mode: 'ask' })} />
            <Radio label={t('sheet.addItself')} selected={draft.mode === 'add'} onPress={() => set({ mode: 'add' })} />
          </FormBlock>
          <FormBlock label={t('sheet.ends')}>
            <Radio label={t('sheet.endNever')} selected={draft.ends === 'never'} onPress={() => set({ ends: 'never' })} />
            <Radio label={t('sheet.endDate')} selected={draft.ends === 'date'} onPress={() => set({ ends: 'date', endDate: draft.endDate ?? format(shownEnd, DAY) })} />
            {draft.ends === 'date' ? <Calendar value={shownEnd} min={earliest} onChange={(day) => set({ endDate: format(day, DAY) })} /> : null}
            <Radio label={t('sheet.endTimes')} selected={draft.ends === 'times'} onPress={() => set({ ends: 'times' })} />
            {draft.ends === 'times' ? (
              <TextField
                label={t('sheet.times')}
                value={timesText}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, '').slice(0, 3);
                  setTimesText(digits);
                  set({ endTimes: digits ? Number(digits) : null });
                }}
                keyboardType="number-pad"
                placeholder={String(MIN_TIMES)}
                helper={t('sheet.timesHelper')}
                focusOnArrival
              />
            ) : null}
          </FormBlock>
        </>
      )}
    </Sheet>
  );
}
