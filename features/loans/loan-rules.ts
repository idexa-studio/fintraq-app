import type { Account } from '@/data/repositories/accounts';
import { isLoanPrincipal } from '@/data/repositories/ledger';
import type { CreateLoanData, LoanRepaymentRow, LoanType, LoanWithStats } from '@/data/repositories/loans';
import { getLocalISOString } from '@/shared/date/date';
import { parseAmountInput } from '@/shared/format/amount';

export const NOTE_MAX = 120;

// ── A new loan ───────────────────────────────────────────────────────────────

export type LoanDraft = {
  type: LoanType;
  personId: number | null;
  /** As typed. */
  amountText: string;
  accountId: number | null;
  /** The day it should be settled by, if one was agreed. */
  dueDate: Date | null;
  note: string;
};

/** Why the loan cannot be recorded yet. */
export type LoanBlocker = 'amount' | 'person' | 'account';

export const newLoanDraft = (type: LoanType, personId: number | null, accountId: number | null): LoanDraft => ({ type, personId, amountText: '', accountId, dueDate: null, note: '' });

const amountOf = (text: string): number => parseAmountInput(text) ?? 0;

/**
 * Money lent needs someone to get it back from. Money borrowed may come from
 * somewhere with no name on it (a shop, a card), so the person is optional.
 */
export function loanBlockerOf(draft: LoanDraft): LoanBlocker | null {
  if (amountOf(draft.amountText) <= 0) return 'amount';
  if (draft.type === 'lend' && draft.personId === null) return 'person';
  if (draft.accountId === null) return 'account';
  return null;
}

/** What is saved: the loan, and the details of the payment that moves the money. */
export function loanPayloadOf(draft: LoanDraft, account: Pick<Account, 'id' | 'currency'>, now: Date): { data: CreateLoanData; txPayload: { note: string; datetime: string } } {
  const note = draft.note.trim();
  return {
    data: {
      personId: draft.personId ?? undefined,
      type: draft.type,
      principal: amountOf(draft.amountText),
      currency: account.currency,
      accountId: account.id,
      // The chosen calendar day, not its UTC date (a day early just after midnight east of UTC).
      dueDate: draft.dueDate ? getLocalISOString(draft.dueDate) : undefined,
      note,
    },
    txPayload: { note, datetime: now.toISOString() },
  };
}

export const isLoanDraftTouched = (draft: LoanDraft): boolean => !!draft.amountText || !!draft.note || draft.dueDate !== null;

// ── A repayment ──────────────────────────────────────────────────────────────

export type RepaymentBlocker = 'amount' | 'tooMuch' | 'account';

/** A repayment is more than nothing and no more than is still outstanding. */
export function repaymentBlockerOf(amountText: string, outstanding: number, accountId: number | null): RepaymentBlocker | null {
  const amount = amountOf(amountText);
  if (amount <= 0) return 'amount';
  // Compared in whole cents, so typing exactly what is owed is never refused over a rounding crumb.
  if (Math.round(amount * 100) > Math.round(outstanding * 100)) return 'tooMuch';
  if (accountId === null) return 'account';
  return null;
}

export const repaymentAmountOf = amountOf;

/** The accounts a repayment can move through: those in the loan's currency, the loan's own first. */
export function repaymentAccounts<T extends Pick<Account, 'id' | 'currency'>>(accounts: readonly T[], loan: Pick<LoanWithStats, 'currency' | 'accountId'>): T[] {
  return accounts.filter((account) => account.currency === loan.currency).sort((a, b) => Number(b.id === loan.accountId) - Number(a.id === loan.accountId));
}

// ── The loan as a story ──────────────────────────────────────────────────────

export type LoanEvent =
  | { kind: 'opened'; amount: number; at: string; account: string }
  | { kind: 'repayment'; amount: number; at: string; account: string }
  /** What is still outstanding, and when it is due if a day was agreed. */
  | { kind: 'remaining'; amount: number; due: string | null; overdue: boolean }
  | { kind: 'settled' };

/**
 * A loan from start to where it stands: the money going out or coming in,
 * each repayment in the order it happened, then either what is left or that
 * it is settled.
 */
export function loanStory(loan: Pick<LoanWithStats, 'type' | 'outstanding' | 'dueDate' | 'computedStatus'>, payments: readonly LoanRepaymentRow[]): LoanEvent[] {
  const type = loan.type as LoanType;
  const oldestFirst = [...payments].sort((a, b) => a.datetime.localeCompare(b.datetime));
  const events: LoanEvent[] = oldestFirst.map((payment) => ({
    kind: isLoanPrincipal(payment.type, type) ? 'opened' : 'repayment',
    amount: payment.amount,
    at: payment.datetime,
    account: payment.accountName,
  }));
  if (loan.computedStatus === 'repaid') events.push({ kind: 'settled' });
  else events.push({ kind: 'remaining', amount: loan.outstanding, due: loan.dueDate, overdue: loan.computedStatus === 'overdue' });
  return events;
}

/** How much of the loan has come back, from 0 to 1. */
export const repaidShare = (loan: Pick<LoanWithStats, 'principal' | 'repaid'>): number => (loan.principal > 0 ? Math.min(1, Math.max(0, loan.repaid / loan.principal)) : 0);

// ── Reminders ────────────────────────────────────────────────────────────────

/** How long before the due day a reminder can come, in days. */
export const DUE_REMINDER_DAYS = [0, 1, 3, 7] as const;
export type DueReminderDays = (typeof DUE_REMINDER_DAYS)[number];
export const DEFAULT_REMINDER_TIME = '09:00';
export const DEFAULT_DUE_DAYS: DueReminderDays = 1;
export const DEFAULT_MONTHLY_DAY = 5;
/** Days of the month a monthly reminder can fall on: every month has them. */
export const MONTHLY_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

/** A saved "HH:mm" as hour and minute; anything unreadable is nine in the morning. */
export function timeOf(saved: string | null | undefined): { hour: number; minute: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(saved ?? '');
  const hour = match ? Number(match[1]) : 9;
  const minute = match ? Number(match[2]) : 0;
  return hour <= 23 && minute <= 59 ? { hour, minute } : { hour: 9, minute: 0 };
}

export const timeText = ({ hour, minute }: { hour: number; minute: number }): string => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
