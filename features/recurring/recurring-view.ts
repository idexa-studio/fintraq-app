import type { Advance, RecurringRule } from '@/data/repositories/recurring';
import type { InsertPayment } from '@/data/repositories/transactions';
import { afterOccurrence, dueOccurrences, hasEnded, isRunning, pendingThrough, stoppedBecause } from '@/shared/calc/recurrence';

/**
 * How repeating items read and what they make, worked out from what is stored. Pure, so each
 * screen and the catch-up agree, and every rule here is tested.
 */

export type RuleState = 'running' | 'paused' | 'ended' | 'stopped';

/** What an item is doing: stopped (something it points at was deleted) says the most, then ended, then paused. */
export function stateOf(rule: RecurringRule): RuleState {
  if (stoppedBecause(rule) !== null) return 'stopped';
  if (hasEnded(rule)) return 'ended';
  return rule.paused ? 'paused' : 'running';
}

/** The moment an occurrence is dated: its day at the item's time of day, on the phone's clock. */
export function momentOf(day: string, time: string): Date {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hours || 0, minutes || 0);
}

/** The transaction one occurrence makes: the item's fields on that day, with the amount changed if it was. */
export function occurrencePayment(rule: RecurringRule, day: string, amount: number = rule.amount): InsertPayment {
  if (rule.accountId === null || rule.categoryId === null) throw new Error('A stopped item makes nothing');
  return {
    type: rule.type,
    amount,
    accountId: rule.accountId,
    toAccountId: rule.type === 'TR' ? rule.toAccountId : null,
    categoryId: rule.categoryId,
    personId: rule.personId,
    note: rule.note,
    datetime: momentOf(day, rule.time).toISOString(),
  };
}

/** One occurrence to make or let pass, with where the item stands after it. */
export type OccurrenceWork<T extends RecurringRule = RecurringRule> = { rule: T; day: string; then: Advance };

/** Items added by themselves: every occurrence missed up to today, oldest first, to make now. */
export function catchUpWork<T extends RecurringRule>(rules: readonly T[], today: string): OccurrenceWork<T>[] {
  const work: OccurrenceWork<T>[] = [];
  for (const rule of rules) {
    if (rule.mode !== 'add') continue;
    let occurrences = rule.occurrences;
    for (const day of dueOccurrences(rule, today)) {
      const then = afterOccurrence({ ...rule, occurrences }, day);
      work.push({ rule, day, then });
      occurrences = then.occurrences;
    }
  }
  return work.sort((a, b) => (a.day === b.day ? a.rule.id - b.rule.id : a.day < b.day ? -1 : 1));
}

/** An asked item with something waiting: its oldest day, and how many days are waiting in all. */
export type Waiting<T extends RecurringRule = RecurringRule> = OccurrenceWork<T> & { count: number };

/**
 * Items asked about on their day that have one waiting, oldest first. Only the oldest day of each is
 * offered, so they are added or skipped in order and none is passed over.
 */
export function waitingItems<T extends RecurringRule>(rules: readonly T[], today: string): Waiting<T>[] {
  const waiting: Waiting<T>[] = [];
  for (const rule of rules) {
    if (rule.mode !== 'ask') continue;
    const days = dueOccurrences(rule, today);
    if (days.length > 0) waiting.push({ rule, day: days[0]!, then: afterOccurrence(rule, days[0]!), count: days.length });
  }
  return waiting.sort((a, b) => (a.day === b.day ? a.rule.id - b.rule.id : a.day < b.day ? -1 : 1));
}

/**
 * What repeating expenses will still take from a budget this month: every occurrence not yet made
 * from the 1st to the month's last day, in the budget's currency and category (any, for the budget
 * over all spending). Shown beside the budget, never taken off what is left.
 */
export function stillToCome(
  rules: readonly (RecurringRule & { account: { currency: string } | null })[],
  budget: { categoryId: number | null; currency: string },
  today: string,
): number {
  const first = `${today.slice(0, 8)}01`;
  const [y, m] = today.split('-').map(Number) as [number, number];
  const last = `${today.slice(0, 8)}${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;
  let total = 0;
  for (const rule of rules) {
    if (rule.type !== 'DR' || !isRunning(rule) || rule.account?.currency !== budget.currency) continue;
    if (budget.categoryId !== null && rule.categoryId !== budget.categoryId) continue;
    for (const day of pendingThrough(rule, last)) if (day >= first) total += rule.amount;
  }
  return total;
}
