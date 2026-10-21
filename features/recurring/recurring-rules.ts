/**
 * The rules of repeating items (approved by the owner on 2026-10-21, plan task I1.01), pure and
 * tested. Days are calendar days written `YYYY-MM-DD` and are never turned into a moment in time,
 * so a change of time zone or of daylight saving cannot move an item to another day.
 */

export type Cadence = 'week' | 'twoWeeks' | 'month' | 'year';
export type RepeatMode = 'ask' | 'add';
export type RepeatEnd = 'never' | 'date' | 'times';

/** The fields of an item the rules read. */
export type RuleTiming = {
  cadence: Cadence;
  /** The day it repeats from: the first transaction's day. */
  anchorDate: string;
  nextDue: string;
  ends: RepeatEnd;
  endDate: string | null;
  endTimes: number | null;
  /** Occurrences passed, made or skipped. */
  occurrences: number;
  paused: boolean;
};

/** What an item points at, enough to know whether it can still run. */
export type RuleTargets = { type: 'CR' | 'DR' | 'TR'; accountId: number | null; toAccountId: number | null; categoryId: number | null };

export const CADENCES: readonly Cadence[] = ['week', 'twoWeeks', 'month', 'year'];

const DAY_MS = 24 * 60 * 60 * 1000;

const parts = (day: string): [number, number, number] => {
  const [y, m, d] = day.split('-').map(Number);
  return [y!, m!, d!];
};
const write = (y: number, m: number, d: number): string => `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
/** Days in a month, `m` from 1. */
const daysIn = (y: number, m: number): number => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** The day `days` after `day`. Worked in UTC, where every day is 24 hours long. */
export function addDays(day: string, days: number): string {
  const [y, m, d] = parts(day);
  const t = new Date(Date.UTC(y, m - 1, d) + days * DAY_MS);
  return write(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/**
 * The anchor's day, `months` months on. A day the month does not have (the 31st, 29 February) is
 * the month's last day; it is worked from the anchor each time, never from the previous date, so
 * the 31st comes back after a short month.
 */
function addMonths(anchor: string, months: number): string {
  const [y, m, d] = parts(anchor);
  const index = y * 12 + (m - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return write(year, month, Math.min(d, daysIn(year, month)));
}

/** The `n`th occurrence of an item, the anchor being the 0th. */
export function occurrence(anchor: string, cadence: Cadence, n: number): string {
  switch (cadence) {
    case 'week': return addDays(anchor, 7 * n);
    case 'twoWeeks': return addDays(anchor, 14 * n);
    case 'month': return addMonths(anchor, n);
    case 'year': return addMonths(anchor, 12 * n);
  }
}

/** Roughly how many occurrences fit between two days, to start the search near the answer. */
function estimate(anchor: string, cadence: Cadence, day: string): number {
  const span = (Date.UTC(...toUtc(day)) - Date.UTC(...toUtc(anchor))) / DAY_MS;
  const length = { week: 7, twoWeeks: 14, month: 30.44, year: 365.25 }[cadence];
  return Math.max(0, Math.floor(span / length) - 1);
}
const toUtc = (day: string): [number, number, number] => {
  const [y, m, d] = parts(day);
  return [y, m - 1, d];
};

/** The first occurrence strictly after `day`. */
export function nextAfter(anchor: string, cadence: Cadence, day: string): string {
  let n = estimate(anchor, cadence, day);
  while (occurrence(anchor, cadence, n) <= day) n += 1;
  return occurrence(anchor, cadence, n);
}

/** The first transaction's day is the 0th occurrence, so a new item is next due one period on. */
export const firstDue = (anchor: string, cadence: Cadence): string => occurrence(anchor, cadence, 1);

/** Whether an item has run its course: past its end date, or all its times passed. */
export function hasEnded(rule: Pick<RuleTiming, 'ends' | 'endDate' | 'endTimes' | 'occurrences' | 'nextDue'>): boolean {
  if (rule.ends === 'date') return rule.endDate !== null && rule.nextDue > rule.endDate;
  if (rule.ends === 'times') return rule.endTimes !== null && rule.occurrences >= rule.endTimes;
  return false;
}

export type StopReason = 'account' | 'toAccount' | 'category';

/** Why an item cannot run, when something it points at was deleted; null when it can. */
export function stoppedBecause(rule: RuleTargets): StopReason | null {
  if (rule.accountId === null) return 'account';
  if (rule.type === 'TR') return rule.toAccountId === null ? 'toAccount' : null;
  return rule.categoryId === null ? 'category' : null;
}

/** Where an item stands after one occurrence passes, made or skipped. */
export const afterOccurrence = (rule: Pick<RuleTiming, 'anchorDate' | 'cadence' | 'occurrences'>, day: string) => ({
  nextDue: nextAfter(rule.anchorDate, rule.cadence, day),
  occurrences: rule.occurrences + 1,
});

/**
 * The occurrences that are due by `today` and not yet made or skipped, oldest first: every day
 * from the item's next due up to today, stopping at its end. None while paused or stopped.
 */
export function dueOccurrences(rule: RuleTiming & RuleTargets, today: string): string[] {
  if (rule.paused || stoppedBecause(rule) !== null) return [];
  const due: string[] = [];
  let state = { nextDue: rule.nextDue, occurrences: rule.occurrences };
  while (state.nextDue <= today && !hasEnded({ ...rule, ...state })) {
    due.push(state.nextDue);
    state = afterOccurrence({ ...rule, occurrences: state.occurrences }, state.nextDue);
  }
  return due;
}

/** On resume, an item carries on from its next day after today; what fell while paused is let go. */
export const resumedNextDue = (rule: Pick<RuleTiming, 'anchorDate' | 'cadence'>, today: string): string => nextAfter(rule.anchorDate, rule.cadence, today);

/** One day an item will fall on. */
export type Upcoming = { day: string; ruleId: number };

/** What falls from today to `days` days on, in date order: running items only, up to their end. */
export function upcoming(rules: readonly (RuleTiming & RuleTargets & { id: number })[], today: string, days = 30): Upcoming[] {
  const last = addDays(today, days);
  const out: Upcoming[] = [];
  for (const rule of rules) {
    if (rule.paused || stoppedBecause(rule) !== null) continue;
    // Days already past are not upcoming: an asked item waiting from before today is on Home's Due today.
    let state = { nextDue: rule.nextDue, occurrences: rule.occurrences };
    while (state.nextDue <= last && !hasEnded({ ...rule, ...state })) {
      if (state.nextDue >= today) out.push({ day: state.nextDue, ruleId: rule.id });
      state = afterOccurrence({ ...rule, occurrences: state.occurrences }, state.nextDue);
    }
  }
  return out.sort((a, b) => (a.day === b.day ? a.ruleId - b.ruleId : a.day < b.day ? -1 : 1));
}
