import type { LoanWithStats } from '@/data/repositories/loans';
import { parseDateKey } from '@/shared/date/date';
import { differenceInCalendarDays } from 'date-fns';

type PlanLoan = Pick<LoanWithStats, 'id' | 'type' | 'currency' | 'outstanding' | 'dueDate' | 'computedStatus'>;

/**
 * A currency's loans in the order they need attention: those with a due
 * date soonest first (so anything overdue leads), then those with none,
 * largest first. Settled ones are kept apart.
 */
export function planLoans<T extends PlanLoan>(loans: readonly T[], currency: string): { dated: T[]; undated: T[]; settled: T[] } {
  const mine = loans.filter((loan) => loan.currency === currency);
  const open = mine.filter((loan) => loan.computedStatus !== 'repaid');
  return {
    dated: open.filter((loan) => loan.dueDate).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!)),
    undated: open.filter((loan) => !loan.dueDate).sort((a, b) => b.outstanding - a.outstanding),
    settled: mine.filter((loan) => loan.computedStatus === 'repaid'),
  };
}

/** What is owed to you and by you across a currency's open loans. */
export function loanTotals(loans: readonly PlanLoan[], currency: string): { owed: number; owe: number } {
  let owed = 0;
  let owe = 0;
  for (const loan of loans) {
    if (loan.currency !== currency || loan.computedStatus === 'repaid') continue;
    if (loan.type === 'lend') owed += loan.outstanding;
    else owe += loan.outstanding;
  }
  return { owed, owe };
}

/** How far off a due day is, in whole calendar days: negative once it has passed. */
export const daysUntil = (dueDate: string, today: Date): number => differenceInCalendarDays(parseDateKey(dueDate.slice(0, 10)), today);

/** How a due day is worded, from how far off it is. */
export type DueWording = { key: 'overdue' | 'today' | 'tomorrow' | 'inDays'; count: number };
export function dueWording(dueDate: string, today: Date): DueWording {
  const days = daysUntil(dueDate, today);
  if (days < 0) return { key: 'overdue', count: -days };
  if (days === 0) return { key: 'today', count: 0 };
  if (days === 1) return { key: 'tomorrow', count: 1 };
  return { key: 'inDays', count: days };
}
