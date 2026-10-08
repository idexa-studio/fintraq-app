import { localDateKey } from '@/platform/notifications/reminder-plan';

/**
 * Which line the daily reminder carries on a given day: pure, so it is testable and says nothing
 * the records do not back.
 *
 * A reminder's text is fixed when it is scheduled, days ahead. That stays true because every write
 * to the records reschedules: a reminder only fires with the text it was given if nothing was
 * added in between, which is exactly the case its text describes.
 */

export const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export type LoanDue = { type: 'lend' | 'borrow'; personName: string | null; dueDate: string | null; outstanding: number; currency: string; hasOwnReminder: boolean };

export type DailyFacts = {
  /** The local day ("YYYY-MM-DD") of each recent entry, one per entry. */
  entryDays: readonly string[];
  /** The local day of the newest entry of all, or null when nothing was ever recorded. */
  lastEntryDay: string | null;
  loans: readonly LoanDue[];
};

export type DailyLine =
  | { kind: 'first' }
  | { kind: 'loanTomorrow'; loanType: 'lend' | 'borrow'; personName: string; outstanding: number; currency: string }
  | { kind: 'quiet' }
  | { kind: 'monthEnd'; month: Date; count: number }
  | { kind: 'monthStart'; month: Date }
  | { kind: 'missedYesterday' }
  | { kind: 'quietSince'; since: Date }
  | { kind: 'weekEnd'; count: number }
  | { kind: 'weekday'; day: Weekday };

/**
 * Days without an entry before the reminder stops counting them and invites a fresh start. It says
 * so that day and once a week after; the days between get their ordinary line, not the same one.
 */
export const QUIET_AFTER_DAYS = 7;

const dayAt = (date: Date, offset: number): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
const daysBetween = (from: Date, to: Date): number => Math.round((dayAt(to, 0).getTime() - dayAt(from, 0).getTime()) / 86_400_000);
const parseDay = (key: string): Date => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)));

/** Entries from `from` up to, not including, `until`. */
const countBetween = (entryDays: readonly string[], from: Date, until: Date): number => {
  const first = localDateKey(from);
  const end = localDateKey(until);
  return entryDays.filter((day) => day >= first && day < end).length;
};

/**
 * The line for `date`, most specific first: money due tomorrow, a long silence, the month turning,
 * a short gap, the week closing, then the plain line for that weekday.
 */
export function dailyLineFor(date: Date, facts: DailyFacts): DailyLine {
  if (!facts.lastEntryDay) return { kind: 'first' };

  const tomorrow = localDateKey(dayAt(date, 1));
  // A loan that reminds by itself is left to its own notification.
  const due = facts.loans.find((loan) => loan.personName && !loan.hasOwnReminder && loan.outstanding > 0 && loan.dueDate?.slice(0, 10) === tomorrow);
  if (due?.personName) return { kind: 'loanTomorrow', loanType: due.type, personName: due.personName, outstanding: due.outstanding, currency: due.currency };

  const lastEntry = parseDay(facts.lastEntryDay);
  const gap = daysBetween(lastEntry, date);
  const quiet = gap >= QUIET_AFTER_DAYS;
  if (quiet && gap % QUIET_AFTER_DAYS === 0) return { kind: 'quiet' };

  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  if (dayAt(date, 1).getMonth() !== date.getMonth()) {
    const count = countBetween(facts.entryDays, monthStart, date);
    if (count > 0) return { kind: 'monthEnd', month: monthStart, count };
  }
  if (date.getDate() === 1) return { kind: 'monthStart', month: monthStart };

  if (gap === 2) return { kind: 'missedYesterday' };
  if (gap > 2 && !quiet) return { kind: 'quietSince', since: lastEntry };

  // Weeks run Monday to Sunday.
  if (date.getDay() === 0) {
    const count = countBetween(facts.entryDays, dayAt(date, -6), date);
    if (count > 0) return { kind: 'weekEnd', count };
  }
  return { kind: 'weekday', day: WEEKDAYS[date.getDay()]! };
}

/** How far back entries are needed to answer for any day in the scheduling window. */
export function factsWindowStart(now: Date): Date {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  // A week that closes today can have begun in the month before.
  const weekBack = dayAt(now, -6);
  return weekBack < monthStart ? weekBack : monthStart;
}
