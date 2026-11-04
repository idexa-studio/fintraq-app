import type { NewRecurringRule, RecurringRule } from '@/data/repositories/recurring';
import type { Cadence, RepeatEnd, RepeatMode } from '@/shared/calc/recurrence';
import { firstDue, rescheduled, resumedNextDue, stoppedBecause } from '@/shared/calc/recurrence';
import { format } from 'date-fns';

/** "Repeat" as chosen on the entry form: not at all, or how often, what happens on its day, and when it ends. */
export type RepeatDraft = {
  cadence: Cadence | null;
  mode: RepeatMode;
  ends: RepeatEnd;
  /** The last day it may fall on (YYYY-MM-DD), when it ends on a date. */
  endDate: string | null;
  /** How many times in all, the first transaction included, when it ends after a number. */
  endTimes: number | null;
};

/** A new entry does not repeat; once it does, it is asked about on its day, since amounts like a bill change. */
export const NO_REPEAT: RepeatDraft = { cadence: null, mode: 'ask', ends: 'never', endDate: null, endTimes: null };

export const repeatOf = (rule: Pick<RecurringRule, 'cadence' | 'mode' | 'ends' | 'endDate' | 'endTimes'>): RepeatDraft => ({
  cadence: rule.cadence, mode: rule.mode, ends: rule.ends, endDate: rule.endDate, endTimes: rule.endTimes,
});

/** The fewest times an item can be set to run: the first transaction and one more. */
export const MIN_TIMES = 2;

/** Why the end is not complete yet: no day after the first, or fewer than two times. */
export type RepeatBlocker = 'endDate' | 'endTimes';

export function repeatBlocker(draft: RepeatDraft, firstDay: string): RepeatBlocker | null {
  if (draft.cadence === null) return null;
  if (draft.ends === 'date' && (draft.endDate === null || draft.endDate <= firstDay)) return 'endDate';
  if (draft.ends === 'times' && (draft.endTimes === null || !Number.isInteger(draft.endTimes) || draft.endTimes < MIN_TIMES)) return 'endTimes';
  return null;
}

/** What an item makes each time, as the entry form saves it. */
export type RulePayment = Required<Pick<NewRecurringRule, 'type' | 'amount' | 'accountId' | 'toAccountId' | 'categoryId' | 'personId' | 'note'>>;

const dayOf = (when: Date): string => format(when, 'yyyy-MM-dd');
const timeOf = (when: Date): string => format(when, 'HH:mm');

const endOf = (draft: RepeatDraft) => ({
  ends: draft.ends,
  endDate: draft.ends === 'date' ? draft.endDate : null,
  endTimes: draft.ends === 'times' ? draft.endTimes : null,
});

/**
 * The item a transaction saved with Repeat makes: it repeats from the transaction's day at its
 * time, the transaction is its first time, and the next is one period on.
 */
export function newRuleOf(payment: RulePayment, draft: RepeatDraft & { cadence: Cadence }, when: Date): NewRecurringRule {
  const anchorDate = dayOf(when);
  return {
    ...payment,
    toAccountId: payment.type === 'TR' ? payment.toAccountId : null,
    cadence: draft.cadence,
    anchorDate,
    time: timeOf(when),
    nextDue: firstDue(anchorDate, draft.cadence),
    mode: draft.mode,
    ...endOf(draft),
    occurrences: 1,
    paused: false,
  };
}

/**
 * An item after it is changed on the entry form, where `when` is its next day and time. Only what
 * it makes from now on changes. A new day or cadence starts it again from that day. A stopped item
 * pointed at another account or category carries on from its next day after today, as a resumed
 * one does: what fell while it could not run is let go, never made all at once.
 */
export function changedRuleOf(rule: RecurringRule, payment: RulePayment, draft: RepeatDraft & { cadence: Cadence }, when: Date, today: string): Partial<NewRecurringRule> {
  const day = dayOf(when);
  const moved = rescheduled(rule, { cadence: draft.cadence, day });
  const repaired = stoppedBecause(rule) !== null && moved.nextDue === rule.nextDue && moved.nextDue < today;
  return {
    ...payment,
    toAccountId: payment.type === 'TR' ? payment.toAccountId : null,
    ...moved,
    ...(repaired ? { nextDue: resumedNextDue(moved, today) } : {}),
    time: timeOf(when),
    mode: draft.mode,
    ...endOf(draft),
  };
}
