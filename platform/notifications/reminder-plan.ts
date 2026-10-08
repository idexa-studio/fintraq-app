import { parseDateKey } from '@/shared/date/date';

/**
 * Which reminders should exist, and when — pure, so it's testable and the sync can simply make the
 * OS match it. Nothing here touches the notification APIs.
 */

export type Clock = { hours: number; minutes: number };

export type LoanReminderSource = {
  id: number;
  type: 'lend' | 'borrow';
  personName: string | null;
  /** What is still to be repaid, in `currency`. */
  outstanding: number;
  currency: string;
  dueDate: string | null;
  emiReminderEnabled: boolean;
  emiReminderDay: number | null;
  emiReminderTime: string | null;
  dueReminderEnabled: boolean;
  dueReminderDaysBefore: number | null;
  dueReminderTime: string | null;
};

export type PlannedReminder =
  | { kind: 'daily'; id: string; date: Date }
  | ({ kind: 'emi'; id: string; date: Date } & LoanSubject)
  | ({ kind: 'due'; id: string; date: Date; daysBefore: number } & LoanSubject);

/** The loan a reminder is about, as its text needs it. */
export type LoanSubject = { loanId: number; loanType: 'lend' | 'borrow'; personName: string | null; outstanding: number; currency: string };

/** Identifiers this app owns; the sync cancels exactly these before rescheduling. */
export const REMINDER_ID_PREFIXES = ['daily_reminder', 'loan_emi_', 'loan_due_'] as const;
export const isAppReminderId = (id: string): boolean => REMINDER_ID_PREFIXES.some((p) => id.startsWith(p));

/** Days of daily reminders kept scheduled ahead; topped up on every launch and resume. */
export const DAILY_WINDOW_DAYS = 14;
/** Months of EMI reminders kept scheduled ahead. */
export const EMI_WINDOW_MONTHS = 6;
export const DEFAULT_DUE_TIME: Clock = { hours: 9, minutes: 0 };

/** iOS keeps at most 64 pending local notifications; stay under it, nearest first. */
export const IOS_PENDING_LIMIT = 60;

export function parseClock(value: string | null | undefined): Clock | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? { hours, minutes } : null;
}

/** "YYYY-MM-DD" in local time. */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** A "YYYY-MM-DD" date as local midnight, or null when malformed. */
export function parseLocalDate(value: string): Date | null {
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? parseDateKey(value) : null;
}

const daysInMonth = (year: number, month: number): number => new Date(year, month + 1, 0).getDate();

/**
 * One reminder per day at `time`, from today (if the time is still ahead) for the window. Skips
 * today when `skipDateKey` is today — the user already logged something.
 */
export function planDailyReminders(now: Date, time: Clock, skipDateKey: string | null, days = DAILY_WINDOW_DAYS): PlannedReminder[] {
  const planned: PlannedReminder[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, time.hours, time.minutes, 0, 0);
    if (date <= now) continue;
    const key = localDateKey(date);
    if (key === skipDateKey) continue;
    planned.push({ kind: 'daily', id: `daily_reminder_${key}`, date });
  }
  return planned;
}

/**
 * Monthly reminders on `day`, clamped to each month's length: the 31st falls on 28/29 Feb and on
 * the 30th in 30-day months, instead of rolling over into the next month.
 */
export function monthlyDates(now: Date, day: number, time: Clock, months = EMI_WINDOW_MONTHS): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i <= months; i++) {
    const year = now.getFullYear();
    const month = now.getMonth() + i;
    const first = new Date(year, month, 1);
    const clamped = Math.min(Math.max(1, day), daysInMonth(first.getFullYear(), first.getMonth()));
    const date = new Date(first.getFullYear(), first.getMonth(), clamped, time.hours, time.minutes, 0, 0);
    if (date > now) dates.push(date);
    if (dates.length === months) break;
  }
  return dates;
}

/** `daysBefore` days ahead of the due date, at `time`, if that moment is still to come. */
export function dueReminderDate(dueDate: string, daysBefore: number, time: Clock, now: Date): Date | null {
  const due = parseLocalDate(dueDate);
  if (!due) return null;
  const date = new Date(due.getFullYear(), due.getMonth(), due.getDate() - daysBefore, time.hours, time.minutes, 0, 0);
  return date > now ? date : null;
}

export function planLoanReminders(now: Date, loans: readonly LoanReminderSource[]): PlannedReminder[] {
  const planned: PlannedReminder[] = [];
  for (const loan of loans) {
    const subject: LoanSubject = { loanId: loan.id, loanType: loan.type, personName: loan.personName, outstanding: loan.outstanding, currency: loan.currency };
    const emiTime = parseClock(loan.emiReminderTime);
    if (loan.emiReminderEnabled && loan.emiReminderDay != null && emiTime) {
      for (const date of monthlyDates(now, loan.emiReminderDay, emiTime)) {
        planned.push({ kind: 'emi', id: `loan_emi_${loan.id}_${date.getFullYear()}_${date.getMonth()}`, date, ...subject });
      }
    }
    // Loans saved before the due time was stored fall back to the EMI time, then the morning.
    const dueTime = parseClock(loan.dueReminderTime) ?? emiTime ?? DEFAULT_DUE_TIME;
    if (loan.dueReminderEnabled && loan.dueDate && loan.dueReminderDaysBefore != null) {
      const date = dueReminderDate(loan.dueDate, loan.dueReminderDaysBefore, dueTime, now);
      if (date) planned.push({ kind: 'due', id: `loan_due_${loan.id}`, date, daysBefore: loan.dueReminderDaysBefore, ...subject });
    }
  }
  return planned;
}

/** Nearest first, capped where the platform limits pending notifications. */
export function capReminders(planned: readonly PlannedReminder[], limit: number | null): PlannedReminder[] {
  const sorted = [...planned].sort((a, b) => a.date.getTime() - b.date.getTime());
  return limit == null ? sorted : sorted.slice(0, limit);
}
