import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { accounts, categories, loans, payments, persons } from '../../../db/schema';
import { TransactionType } from '../../../types';
import { applyBalanceDelta } from '../../transactions/api/transactions';

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = typeof loans.$inferInsert;
export type UpdateLoanData = Partial<Omit<InsertLoan, 'id' | 'createdAt' | 'updatedAt'>>;

export type LoanStatus = 'active' | 'repaid' | 'overdue';
export type LoanType = 'lend' | 'borrow';

export type LoanWithStats = Loan & {
  outstanding: number;
  repaid: number;
  personName: string | null;
  personColor: number | null;
  accountName: string;
  categoryName: string;
  computedStatus: LoanStatus;
};

export type LoanSummary = {
  totalLent: number;
  totalBorrowed: number;
  activeLentCount: number;
  activeBorrowedCount: number;
  overdueLentCount: number;
  overdueBorrowedCount: number;
  overdueCount: number;
};

export type LoanRepaymentRow = {
  id: number;
  amount: number;
  type: TransactionType;
  datetime: string;
  note: string;
  accountName: string;
  accountCurrency: string;
};

function computeStatus(loan: Loan, outstanding: number): LoanStatus {
  if (loan.status === 'repaid' || outstanding <= 0) return 'repaid';
  if (loan.dueDate && new Date() > new Date(loan.dueDate)) return 'overdue';
  return 'active';
}

export const getLoans = async (type?: LoanType): Promise<LoanWithStats[]> => {
  const baseQuery = db
    .select({
      loan: loans,
      personName: persons.name,
      personColor: persons.color,
      accountName: accounts.name,
      categoryName: categories.name,
      repaid: sql<number>`COALESCE((
        SELECT SUM(p2.amount) FROM payments p2
        WHERE p2.loan_id = ${loans.id}
        AND p2.type = CASE WHEN ${loans.type} = 'lend' THEN 'CR' ELSE 'DR' END
      ), 0)`,
    })
    .from(loans)
    .leftJoin(persons, eq(loans.personId, persons.id))
    .innerJoin(accounts, eq(loans.accountId, accounts.id))
    .innerJoin(categories, eq(loans.categoryId, categories.id))
    .orderBy(desc(loans.createdAt));

  const rows = type
    ? await baseQuery.where(eq(loans.type, type))
    : await baseQuery;

  return rows.map(r => {
    const repaid = r.repaid ?? 0;
    const outstanding = Math.max(0, r.loan.principal - repaid);
    return {
      ...r.loan,
      personName: r.personName ?? null,
      personColor: r.personColor ?? null,
      accountName: r.accountName,
      categoryName: r.categoryName,
      repaid,
      outstanding,
      computedStatus: computeStatus(r.loan, outstanding),
    };
  });
};

export const getLoansByPerson = async (personId: number): Promise<LoanWithStats[]> => {
  const rows = await db
    .select({
      loan: loans,
      personName: persons.name,
      personColor: persons.color,
      accountName: accounts.name,
      categoryName: categories.name,
      repaid: sql<number>`COALESCE((
        SELECT SUM(p2.amount) FROM payments p2
        WHERE p2.loan_id = ${loans.id}
        AND p2.type = CASE WHEN ${loans.type} = 'lend' THEN 'CR' ELSE 'DR' END
      ), 0)`,
    })
    .from(loans)
    .leftJoin(persons, eq(loans.personId, persons.id))
    .innerJoin(accounts, eq(loans.accountId, accounts.id))
    .innerJoin(categories, eq(loans.categoryId, categories.id))
    .where(eq(loans.personId, personId))
    .orderBy(desc(loans.createdAt));

  return rows.map(r => {
    const repaid = r.repaid ?? 0;
    const outstanding = Math.max(0, r.loan.principal - repaid);
    return {
      ...r.loan,
      personName: r.personName ?? null,
      personColor: r.personColor ?? null,
      accountName: r.accountName,
      categoryName: r.categoryName,
      repaid,
      outstanding,
      computedStatus: computeStatus(r.loan, outstanding),
    };
  });
};

export const getLoanById = async (id: number): Promise<Loan | undefined> => {
  const [result] = await db.select().from(loans).where(eq(loans.id, id));
  return result;
};

export const getLoanWithStats = async (id: number): Promise<LoanWithStats | undefined> => {
  const [row] = await db
    .select({
      loan: loans,
      personName: persons.name,
      personColor: persons.color,
      accountName: accounts.name,
      categoryName: categories.name,
      repaid: sql<number>`COALESCE((
        SELECT SUM(p2.amount) FROM payments p2
        WHERE p2.loan_id = ${loans.id}
        AND p2.type = CASE WHEN ${loans.type} = 'lend' THEN 'CR' ELSE 'DR' END
      ), 0)`,
    })
    .from(loans)
    .leftJoin(persons, eq(loans.personId, persons.id))
    .innerJoin(accounts, eq(loans.accountId, accounts.id))
    .innerJoin(categories, eq(loans.categoryId, categories.id))
    .where(eq(loans.id, id));

  if (!row) return undefined;
  const repaid = row.repaid ?? 0;
  const outstanding = Math.max(0, row.loan.principal - repaid);
  return {
    ...row.loan,
    personName: row.personName ?? null,
    personColor: row.personColor ?? null,
    accountName: row.accountName,
    categoryName: row.categoryName,
    repaid,
    outstanding,
    computedStatus: computeStatus(row.loan, outstanding),
  };
};

export const getLoanRepayments = async (loanId: number): Promise<LoanRepaymentRow[]> => {
  const result = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      type: payments.type,
      datetime: payments.datetime,
      note: payments.note,
      accountName: accounts.name,
      accountCurrency: accounts.currency,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(and(eq(payments.loanId, loanId)))
    .orderBy(desc(payments.datetime));

  return result as LoanRepaymentRow[];
};

export const getLoansSummary = async (currency: string): Promise<LoanSummary> => {
  const rows = await db
    .select({
      loan: loans,
      repaid: sql<number>`COALESCE((
        SELECT SUM(p2.amount) FROM payments p2
        WHERE p2.loan_id = ${loans.id}
        AND p2.type = CASE WHEN ${loans.type} = 'lend' THEN 'CR' ELSE 'DR' END
      ), 0)`,
    })
    .from(loans)
    .where(eq(loans.currency, currency));

  let totalLent = 0;
  let totalBorrowed = 0;
  let activeLentCount = 0;
  let activeBorrowedCount = 0;
  let overdueLentCount = 0;
  let overdueBorrowedCount = 0;
  let overdueCount = 0;

  for (const r of rows) {
    const repaid = r.repaid ?? 0;
    const outstanding = Math.max(0, r.loan.principal - repaid);
    const status = computeStatus(r.loan, outstanding);
    if (status === 'repaid') continue;

    if (r.loan.type === 'lend') {
      totalLent += outstanding;
      activeLentCount++;
      if (status === 'overdue') overdueLentCount++;
    } else {
      totalBorrowed += outstanding;
      activeBorrowedCount++;
      if (status === 'overdue') overdueBorrowedCount++;
    }
    if (status === 'overdue') overdueCount++;
  }

  return {
    totalLent,
    totalBorrowed,
    activeLentCount,
    activeBorrowedCount,
    overdueLentCount,
    overdueBorrowedCount,
    overdueCount,
  };
};

export const getActiveLoansWithReminders = async (): Promise<Loan[]> => {
  return db
    .select()
    .from(loans)
    .where(and(eq(loans.status, 'active'), eq(loans.emiReminderEnabled, true)));
};

export const resolveLoanCategory = async (): Promise<number> => {
  // Try to find 'Loan/EMI' (case-insensitive)
  const [loanEmi] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(sql`LOWER(${categories.name}) = 'loan/emi'`)
    .limit(1);

  if (loanEmi) return loanEmi.id;

  // Try to find 'Uncategorized' (case-insensitive)
  const [uncategorized] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(sql`LOWER(${categories.name}) = 'uncategorized'`)
    .limit(1);

  if (uncategorized) return uncategorized.id;

  // Fallback: create Uncategorized if it somehow doesn't exist
  const [newUncategorized] = await db
    .insert(categories)
    .values({
      name: 'Uncategorized',
      icon: 'grid',
      color: 4672089, // #475569
      type: 'DR',
      isSystem: true,
    })
    .returning({ id: categories.id });

  return newUncategorized.id;
};

export const createLoan = async (
  data: InsertLoan,
  txPayload: {
    categoryId?: number;
    note: string;
    datetime: string;
  },
): Promise<Loan> => {
  const categoryId = txPayload.categoryId ?? data.categoryId ?? await resolveLoanCategory();

  const [loan] = await db.insert(loans).values({
    ...data,
    categoryId,
  }).returning();

  const txType: TransactionType = data.type === 'lend' ? 'DR' : 'CR';
  await db.insert(payments).values({
    accountId: data.accountId,
    categoryId: categoryId,
    personId: data.personId,
    loanId: loan.id,
    amount: data.principal,
    type: txType,
    datetime: txPayload.datetime,
    note: txPayload.note || (data.type === 'lend' ? 'Loan given' : 'Loan received'),
  });

  // Keep account balance updated
  await applyBalanceDelta(data.accountId, txType, data.principal, 1);

  return loan;
};

export const updateLoan = async (id: number, data: UpdateLoanData): Promise<Loan> => {
  const [result] = await db
    .update(loans)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(loans.id, id))
    .returning();
  return result;
};

export const markLoanRepaid = async (id: number): Promise<Loan> => {
  return updateLoan(id, { status: 'repaid' });
};

export const deleteLoan = async (id: number): Promise<void> => {
  await db.delete(loans).where(eq(loans.id, id));
};

export const addRepayment = async (payload: {
  loanId: number;
  loanType: LoanType;
  personId: number | null;
  accountId: number;
  categoryId?: number;
  amount: number;
  datetime: string;
  note: string;
}): Promise<{ repaymentId: number; isFullyRepaid: boolean }> => {
  const categoryId = payload.categoryId ?? await resolveLoanCategory();
  const txType: TransactionType = payload.loanType === 'lend' ? 'CR' : 'DR';

  const [tx] = await db.insert(payments).values({
    accountId: payload.accountId,
    categoryId: categoryId,
    personId: payload.personId,
    loanId: payload.loanId,
    amount: payload.amount,
    type: txType,
    datetime: payload.datetime,
    note: payload.note || (payload.loanType === 'lend' ? 'Loan repayment received' : 'Loan repayment sent'),
  }).returning();

  // Keep account balance updated
  await applyBalanceDelta(payload.accountId, txType, payload.amount, 1);

  const [loanRow] = await db.select().from(loans).where(eq(loans.id, payload.loanId));
  if (!loanRow) return { repaymentId: tx.id, isFullyRepaid: false };

  const [{ totalRepaid }] = await db
    .select({ totalRepaid: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
    .from(payments)
    .where(and(eq(payments.loanId, payload.loanId), eq(payments.type, txType)));

  const outstanding = Math.max(0, loanRow.principal - (totalRepaid ?? 0));
  const isFullyRepaid = outstanding <= 0;

  if (isFullyRepaid && loanRow.status !== 'repaid') {
    await db.update(loans).set({ status: 'repaid', updatedAt: new Date().toISOString() }).where(eq(loans.id, payload.loanId));
  }

  return { repaymentId: tx.id, isFullyRepaid };
};

export const getLoansCount = async (): Promise<number> => {
  const [result] = await db.select({ count: sql<number>`COUNT(*)` }).from(loans).where(eq(loans.status, 'active'));
  return result?.count ?? 0;
};
