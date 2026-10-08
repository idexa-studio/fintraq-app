import { OTHERS_CATEGORY } from '@/shared/contracts/default-categories';
import { and, desc, eq, ne, sql } from 'drizzle-orm';
import { db } from '@/data/db/client';
import { accounts, categories, loans, payments, persons } from '@/data/db/schema';
import { TransactionType } from '@/shared/types';
import { recordPaymentIn } from '@/data/repositories/transactions';
import { loanOutstanding, loanStatus, repaymentType } from '@/data/repositories/ledger';

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = typeof loans.$inferInsert;
/** Create payload — the category may be resolved from the transaction or the loan default. */
export type CreateLoanData = Omit<InsertLoan, 'categoryId'> & { categoryId?: number };
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

/** Sum of a loan's repayments: money back for a loan you gave, money out for one you took. */
const REPAID = sql<number>`COALESCE((
  SELECT SUM(p2.amount) FROM payments p2
  WHERE p2.loan_id = ${loans.id}
  AND p2.type = CASE WHEN ${loans.type} = 'lend' THEN 'CR' ELSE 'DR' END
), 0)`;

/** Live status for display: a loan marked repaid by hand stays repaid; otherwise the ledger rule. */
function computeStatus(loan: Loan, repaid: number): LoanStatus {
  if (loan.status === 'repaid') return 'repaid';
  return loanStatus(loan.principal, repaid, loan.dueDate, new Date());
}

export const getLoans = async (type?: LoanType): Promise<LoanWithStats[]> => {
  const baseQuery = db
    .select({
      loan: loans,
      personName: persons.name,
      personColor: persons.color,
      accountName: accounts.name,
      categoryName: categories.name,
      repaid: REPAID,
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
    const outstanding = loanOutstanding(r.loan.principal, repaid);
    return {
      ...r.loan,
      personName: r.personName ?? null,
      personColor: r.personColor ?? null,
      accountName: r.accountName,
      categoryName: r.categoryName,
      repaid,
      outstanding,
      computedStatus: computeStatus(r.loan, repaid),
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
      repaid: REPAID,
    })
    .from(loans)
    .leftJoin(persons, eq(loans.personId, persons.id))
    .innerJoin(accounts, eq(loans.accountId, accounts.id))
    .innerJoin(categories, eq(loans.categoryId, categories.id))
    .where(eq(loans.personId, personId))
    .orderBy(desc(loans.createdAt));

  return rows.map(r => {
    const repaid = r.repaid ?? 0;
    const outstanding = loanOutstanding(r.loan.principal, repaid);
    return {
      ...r.loan,
      personName: r.personName ?? null,
      personColor: r.personColor ?? null,
      accountName: r.accountName,
      categoryName: r.categoryName,
      repaid,
      outstanding,
      computedStatus: computeStatus(r.loan, repaid),
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
      repaid: REPAID,
    })
    .from(loans)
    .leftJoin(persons, eq(loans.personId, persons.id))
    .innerJoin(accounts, eq(loans.accountId, accounts.id))
    .innerJoin(categories, eq(loans.categoryId, categories.id))
    .where(eq(loans.id, id));

  if (!row) return undefined;
  const repaid = row.repaid ?? 0;
  const outstanding = loanOutstanding(row.loan.principal, repaid);
  return {
    ...row.loan,
    personName: row.personName ?? null,
    personColor: row.personColor ?? null,
    accountName: row.accountName,
    categoryName: row.categoryName,
    repaid,
    outstanding,
    computedStatus: computeStatus(row.loan, repaid),
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
      repaid: REPAID,
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
    const outstanding = loanOutstanding(r.loan.principal, repaid);
    const status = computeStatus(r.loan, repaid);
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

export const resolveLoanCategory = async (): Promise<number> => {
  // Try to find 'Loan/EMI' (case-insensitive)
  const [loanEmi] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(sql`LOWER(${categories.name}) = 'loan/emi'`)
    .limit(1);

  if (loanEmi) return loanEmi.id;

  // Fall back to the system catch-all
  const [others] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(sql`LOWER(${categories.name}) = 'others'`)
    .limit(1);

  if (others) return others.id;

  // Seeds always create it; recreate defensively if it's somehow gone
  const [created] = await db
    .insert(categories)
    .values({ ...OTHERS_CATEGORY })
    .returning({ id: categories.id });

  return created.id;
};

/**
 * Creates the loan and the payment that moved the principal, in one transaction: a loan without
 * its payment (or a payment without its balance change) can't be left behind.
 */
export const createLoan = async (
  data: CreateLoanData,
  txPayload: {
    categoryId?: number;
    note: string;
    datetime: string;
  },
): Promise<Loan> => {
  const categoryId = txPayload.categoryId ?? data.categoryId ?? (await resolveLoanCategory());
  // Lending sends money out of the account; borrowing brings it in.
  const principalType: TransactionType = data.type === 'lend' ? 'DR' : 'CR';

  return db.transaction((tx) => {
    const loan = tx.insert(loans).values({ ...data, categoryId }).returning().get();
    recordPaymentIn(tx, {
      accountId: data.accountId,
      categoryId,
      personId: data.personId,
      loanId: loan.id,
      amount: data.principal,
      type: principalType,
      datetime: txPayload.datetime,
      note: txPayload.note || (data.type === 'lend' ? 'Loan given' : 'Loan received'),
    });
    return loan;
  });
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

/** Records a repayment and updates the loan's status in the same transaction. */
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
  const categoryId = payload.categoryId ?? (await resolveLoanCategory());

  return db.transaction((tx) => {
    const payment = recordPaymentIn(tx, {
      accountId: payload.accountId,
      categoryId,
      personId: payload.personId,
      loanId: payload.loanId,
      amount: payload.amount,
      type: repaymentType(payload.loanType),
      datetime: payload.datetime,
      note: payload.note || (payload.loanType === 'lend' ? 'Loan repayment received' : 'Loan repayment sent'),
    });
    const loan = tx.select({ status: loans.status }).from(loans).where(eq(loans.id, payload.loanId)).get();
    return { repaymentId: payment.id, isFullyRepaid: loan?.status === 'repaid' };
  });
};

/** Open loans, for the free-plan cap. An overdue loan is still open, so only settled ones are left out. */
export const getLoansCount = async (): Promise<number> => {
  const [result] = await db.select({ count: sql<number>`COUNT(*)` }).from(loans).where(ne(loans.status, 'repaid'));
  return result?.count ?? 0;
};
