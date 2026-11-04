import type { RecurringRule, RecurringRuleView } from '@/data/repositories/recurring';
import type { RepeatDraft } from '@/features/recurring/repeat-draft';
import { stateOf } from '@/features/recurring/recurring-view';
import { stoppedBecause } from '@/shared/calc/recurrence';
import { formatDate, parseDateKey } from '@/shared/date/date';
import { useTranslation } from 'react-i18next';

/** The words for repeating items, shared by every screen that shows one, so each reads the same. */
export function useRepeatWords() {
  const { t } = useTranslation(['recurring', 'transactions']);

  /** "Sat, 1 Nov", with the year only when it is not this one. */
  const day = (key: string): string => {
    const date = parseDateKey(key);
    return formatDate(date, date.getFullYear() === new Date().getFullYear() ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
  };

  /** What it is called: its note, else its category, else what kind it is. */
  const name = (rule: Pick<RecurringRuleView, 'note' | 'type' | 'category'>): string =>
    rule.note.trim() || rule.category?.name || (rule.type === 'TR' ? t('transactions:kinds.transfer') : t(`item.kind.${rule.type}`));

  /** Under "Repeat" on Add: how it behaves on its day, and when it ends. */
  const summary = (draft: RepeatDraft): string => {
    const end = draft.ends === 'date' && draft.endDate ? t('repeat.until', { date: day(draft.endDate) })
      : draft.ends === 'times' && draft.endTimes ? t('repeat.times', { count: draft.endTimes })
      : t('repeat.noEnd');
    return `${draft.mode === 'add' ? t('repeat.added') : t('repeat.asked')} · ${end}`;
  };

  /** The second line of an item in a list: how often and when next, or why it is not running. */
  const line = (rule: RecurringRuleView): string => {
    const state = stateOf(rule);
    if (state === 'stopped') return t(`row.stoppedBecause.${stoppedBecause(rule)!}`);
    const parts: string[] = [t(`cadence.${rule.cadence}`)];
    if (state === 'running') parts.push(t('row.next', { date: day(rule.nextDue) }));
    if (state === 'running' && rule.mode === 'add') parts.push(t('row.added'));
    if (rule.type === 'TR' && rule.account && rule.toAccount) parts.push(t('row.route', { from: rule.account.name, to: rule.toAccount.name }));
    return parts.join(' · ');
  };

  /** "Every month, on day 31 or the month's last": the day it falls on, from the day it repeats from. */
  const howOften = (rule: Pick<RecurringRule, 'cadence' | 'anchorDate'>): string => {
    const anchor = parseDateKey(rule.anchorDate);
    switch (rule.cadence) {
      case 'week':
      case 'twoWeeks':
        return t(`item.every.${rule.cadence}`, { weekday: formatDate(anchor, { weekday: 'long' }) });
      case 'month':
        return anchor.getDate() > 28 ? t('item.every.monthEnd', { day: anchor.getDate() }) : t('item.every.month', { day: anchor.getDate() });
      case 'year':
        return t('item.every.year', { date: formatDate(anchor, { day: 'numeric', month: 'long' }) });
    }
  };

  const ends = (rule: Pick<RecurringRule, 'ends' | 'endDate' | 'endTimes' | 'occurrences'>): string => {
    if (rule.ends === 'date' && rule.endDate) return t('item.endsOn', { date: day(rule.endDate) });
    if (rule.ends === 'times' && rule.endTimes) return t('item.endsAfter', { count: rule.endTimes, made: rule.occurrences });
    return t('item.endsNever');
  };

  return { day, name, summary, line, howOften, ends };
}
