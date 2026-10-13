import { eq, gte, lte, max, ne, and } from 'drizzle-orm';
import { db } from '@/data/db/client';
import { PAYMENT_LOCAL_DAY } from '@/data/db/sql';
import { loans, payments, persons } from '@/data/db/schema';
import { loanOutstanding } from '@/data/repositories/ledger';
import { REPAID } from '@/data/repositories/loans';

/** What the reminders need to know about the records: read once per sync, nothing more. */

export type ReminderLoan = {
  id: number;
  type: 'lend' | 'borrow';
  personName: string | null;
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

/** Every loan not yet settled, with what is still to be repaid. */
export const getReminderLoans = async (): Promise<ReminderLoan[]> => {
  const rows = await db
    .select({
      id: loans.id,
      type: loans.type,
      personName: persons.name,
      principal: loans.principal,
      repaid: REPAID,
      currency: loans.currency,
      dueDate: loans.dueDate,
      emiReminderEnabled: loans.emiReminderEnabled,
      emiReminderDay: loans.emiReminderDay,
      emiReminderTime: loans.emiReminderTime,
      dueReminderEnabled: loans.dueReminderEnabled,
      dueReminderDaysBefore: loans.dueReminderDaysBefore,
      dueReminderTime: loans.dueReminderTime,
    })
    .from(loans)
    .leftJoin(persons, eq(loans.personId, persons.id))
    // A settled loan has nothing left to remind about.
    .where(ne(loans.status, 'repaid'));

  return rows.map(({ principal, repaid, ...loan }) => ({ ...loan, outstanding: loanOutstanding(principal, repaid ?? 0) }));
};

/**
 * The local day of each entry from `sinceDay` to `today`, and the day of the newest entry of all
 * (null when there is none). Entries dated in the future are left out: they have not happened.
 */
export const getEntryDays = async (sinceDay: string, today: string): Promise<{ entryDays: string[]; lastEntryDay: string | null }> => {
  const [recent, [newest]] = await Promise.all([
    db.select({ day: PAYMENT_LOCAL_DAY }).from(payments).where(and(gte(PAYMENT_LOCAL_DAY, sinceDay), lte(PAYMENT_LOCAL_DAY, today))),
    db.select({ day: max(PAYMENT_LOCAL_DAY) }).from(payments).where(lte(PAYMENT_LOCAL_DAY, today)),
  ]);
  return { entryDays: recent.map((row) => row.day), lastEntryDay: newest?.day ?? null };
};
