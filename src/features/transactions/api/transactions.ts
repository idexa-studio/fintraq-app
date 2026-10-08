import { SQL, and, asc, count, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { db } from '@/src/db/client';
import { PAYMENT_LOCAL_DAY } from '@/src/db/sql';
import { accounts, categories, payments, persons, loans } from '@/src/db/schema';
import type { TransactionType } from '@/shared/types';
import { LoggerService } from '@/src/services/logger.service';
import { accountDeltas, AccountDelta, isLoanPrincipal, LedgerEntry, LedgerError, loanOutstanding, loanStatus, repaymentType, validateEntry } from '@/src/features/transactions/utils/ledger';

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type UpdatePayment = Omit<InsertPayment, 'id'>;

export const PAGE_SIZE = 20;

/**
 * Everything the transaction list can filter by, all applied in SQL — so the list, its totals and
 * its pagination always agree. Each list matches any of its values; an empty or missing list
 * doesn't filter.
 */
export type TransactionFilters = {
  types?: TransactionType[];
  /** Matches either side of a transfer, so an account's list includes money moved into it. */
  accountIds?: number[];
  categoryIds?: number[];
  personIds?: number[];
  /** Case-insensitive match on the note, category name or account name. */
  search?: string;
  startDate?: string; // local YYYY-MM-DD, inclusive
  endDate?: string;   // local YYYY-MM-DD, inclusive
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
};

const toAccounts = alias(accounts, 'to_accounts');

type AccountTypeValue = 'cash' | 'bank' | 'savings' | 'credit_card' | 'investment' | 'loan' | 'ewallet' | null;

type AccountRef = {
  id: number;
  name: string;
  currency: string;
  color: number;
  icon: string;
  accountType: AccountTypeValue;
};

// Left-joined relations come back as `null` when nothing is linked — Drizzle collapses a nested
// object whose columns are all NULL — never as an object of nulls. Typed that way so every reader
// has to handle "not linked".
export type TransactionListItem = {
  id: number;
  accountId: number;
  categoryId: number;
  toAccountId: number | null;
  personId: number | null;
  amount: number;
  type: TransactionType;
  datetime: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  account: AccountRef;
  category: {
    id: number;
    name: string;
    icon: string;
    color: number;
  };
  /** Transfers only; null otherwise, or when the destination account is gone. */
  toAccount: AccountRef | null;
};

export type TransactionDetail = TransactionListItem & {
  person: {
    id: number;
    name: string;
    color: number;
    designation: string | null;
    company: string | null;
  } | null;
  /** The loan this payment belongs to (its principal or a repayment). */
  loan: {
    id: number;
    type: 'lend' | 'borrow';
  } | null;
};

export const TRANSACTION_LIST_SELECT = {
  id: payments.id,
  accountId: payments.accountId,
  categoryId: payments.categoryId,
  toAccountId: payments.toAccountId,
  personId: payments.personId,
  amount: payments.amount,
  type: payments.type,
  datetime: payments.datetime,
  note: payments.note,
  account: {
    id: accounts.id,
    name: accounts.name,
    currency: accounts.currency,
    color: accounts.color,
    icon: accounts.icon,
    accountType: accounts.accountType,
  },
  category: {
    id: categories.id,
    name: categories.name,
    icon: categories.icon,
    color: categories.color,
  },
  toAccount: {
    id: toAccounts.id,
    name: toAccounts.name,
    currency: toAccounts.currency,
    color: toAccounts.color,
    icon: toAccounts.icon,
    accountType: toAccounts.accountType,
  },
  createdAt: payments.createdAt,
  updatedAt: payments.updatedAt,
} as const;

/** LIKE pattern for a literal substring: escapes the wildcards so "50%" matches "50%". */
const containsPattern = (text: string): string => `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

const buildWhere = (filters: TransactionFilters): SQL | undefined => {
  const conditions: SQL[] = [];
  if (filters.types?.length) conditions.push(inArray(payments.type, filters.types));
  if (filters.accountIds?.length) {
    const ids = filters.accountIds;
    conditions.push(or(inArray(payments.accountId, ids), inArray(payments.toAccountId, ids))!);
  }
  if (filters.categoryIds?.length) conditions.push(inArray(payments.categoryId, filters.categoryIds));
  if (filters.personIds?.length) conditions.push(inArray(payments.personId, filters.personIds));
  const search = filters.search?.trim();
  if (search) {
    const pattern = containsPattern(search);
    // Subqueries rather than joins, so the same condition works for list, count and totals.
    conditions.push(sql`(
      ${payments.note} LIKE ${pattern} ESCAPE '\\'
      OR ${payments.categoryId} IN (SELECT id FROM categories WHERE name LIKE ${pattern} ESCAPE '\\')
      OR ${payments.accountId} IN (SELECT id FROM accounts WHERE name LIKE ${pattern} ESCAPE '\\')
    )`);
  }
  if (filters.startDate) conditions.push(sql`${PAYMENT_LOCAL_DAY} >= ${filters.startDate}`);
  if (filters.endDate) conditions.push(sql`${PAYMENT_LOCAL_DAY} <= ${filters.endDate}`);
  if (filters.minAmount != null) conditions.push(sql`${payments.amount} >= ${filters.minAmount}`);
  if (filters.maxAmount != null) conditions.push(sql`${payments.amount} <= ${filters.maxAmount}`);
  return conditions.length > 0 ? and(...conditions) : undefined;
};

export const getTransactionsPaged = async (
  page: number,
  filters: TransactionFilters = {},
): Promise<TransactionListItem[]> => {
  if (__DEV__) LoggerService.info('TRANSACTIONS', `Fetching page ${page}`, filters);
  try {
    const where = buildWhere(filters);

    // Build ORDER BY from filters — keeps heavy sorting in SQLite, not JS thread
    const orderBy = (() => {
      if (filters.sortBy === 'amount') {
        return filters.sortOrder === 'asc' ? asc(payments.amount) : desc(payments.amount);
      }
      return filters.sortOrder === 'asc' ? asc(payments.datetime) : desc(payments.datetime);
    })();

    const rows = await db
      .select(TRANSACTION_LIST_SELECT)
      .from(payments)
      .innerJoin(accounts, eq(payments.accountId, accounts.id))
      .innerJoin(categories, eq(payments.categoryId, categories.id))
      .leftJoin(toAccounts, eq(payments.toAccountId, toAccounts.id))
      .where(where)
      .orderBy(orderBy)
      .limit(PAGE_SIZE)
      .offset(page * PAGE_SIZE);
    if (__DEV__) LoggerService.info('TRANSACTIONS', `Returned ${rows.length} rows for page ${page}`);
    return rows;
  } catch (err) {
    LoggerService.error('TRANSACTIONS', `Failed to fetch page ${page}`, filters, err);
    throw err;
  }
};

export const getTransactionsCount = async (filters: TransactionFilters = {}) => {
  const where = buildWhere(filters);
  const [row] = await db.select({ total: count() }).from(payments).where(where);
  return row?.total ?? 0;
};

export type TransactionTotals = Record<string, { income: number; expense: number }>;

export const getTransactionTotals = async (filters: TransactionFilters = {}): Promise<TransactionTotals> => {
  const where = buildWhere(filters);
  const rows = await db
    .select({
      currency: accounts.currency,
      income: sql<number>`COALESCE(SUM(CASE WHEN ${payments.type}='CR' THEN ${payments.amount} ELSE 0 END), 0)`,
      expense: sql<number>`COALESCE(SUM(CASE WHEN ${payments.type}='DR' THEN ${payments.amount} ELSE 0 END), 0)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(where)
    .groupBy(accounts.currency);
  const result: TransactionTotals = {};
  rows.forEach(r => { result[r.currency] = { income: r.income, expense: r.expense }; });
  return result;
};

export const getTransactions = async (
  limit: number = 10,
  filters: TransactionFilters = {},
): Promise<TransactionListItem[]> => {
  const where = buildWhere(filters);
  const result = await db
    .select(TRANSACTION_LIST_SELECT)
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .innerJoin(categories, eq(payments.categoryId, categories.id))
    .leftJoin(toAccounts, eq(payments.toAccountId, toAccounts.id))
    .where(where)
    .orderBy(desc(payments.datetime))
    .limit(limit);

  return result;
};

export const getTransactionById = async (id: number): Promise<Payment | null> => {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, id))
    .limit(1);

  return payment ?? null;
};

export const getTransactionDetailById = async (id: number): Promise<TransactionDetail | null> => {
  const [row] = await db
    .select({
      ...TRANSACTION_LIST_SELECT,
      person: {
        id: persons.id,
        name: persons.name,
        color: persons.color,
        designation: persons.designation,
        company: persons.company,
      },
      loan: {
        id: loans.id,
        type: loans.type,
      },
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .innerJoin(categories, eq(payments.categoryId, categories.id))
    .leftJoin(toAccounts, eq(payments.toAccountId, toAccounts.id))
    .leftJoin(persons, eq(payments.personId, persons.id))
    .leftJoin(loans, eq(payments.loanId, loans.id))
    .where(eq(payments.id, id))
    .limit(1);

  return row ?? null;
};

// ─── Ledger writes ───────────────────────────────────────────────────────────
//
// Every write that moves money touches several rows: the payment, one or two account balances and,
// for loan payments, the loan's status. They run in one SQLite transaction so they land together
// or not at all.
//
// The expo-sqlite driver is synchronous: `db.transaction` runs BEGIN, calls the callback, then
// COMMIT. An async callback would commit at its first `await` and run the rest outside the
// transaction, so everything below uses the sync query API (`.get()`, `.all()`, `.run()`).

/** A handle inside `db.transaction`; the ledger helpers below take one so callers can compose them. */
export type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const applyDeltas = (tx: DbTx, deltas: AccountDelta[]): void => {
  for (const d of deltas) {
    tx.update(accounts)
      .set({
        balance: sql`${accounts.balance} + ${d.balance}`,
        income: sql`${accounts.income} + ${d.income}`,
        expense: sql`${accounts.expense} + ${d.expense}`,
      })
      .where(eq(accounts.id, d.accountId))
      .run();
  }
};

/** Both sides of a transfer must exist and share a currency; balances can't mix currencies. */
const assertTransferAccounts = (tx: DbTx, entry: LedgerEntry): void => {
  if (entry.type !== 'TR' || entry.toAccountId == null) return;
  const from = tx.select({ currency: accounts.currency }).from(accounts).where(eq(accounts.id, entry.accountId)).get();
  const to = tx.select({ currency: accounts.currency }).from(accounts).where(eq(accounts.id, entry.toAccountId)).get();
  if (!from || !to) throw new LedgerError('Transfer account not found');
  if (from.currency !== to.currency) throw new LedgerError('Transfer accounts must share a currency');
};

/** What has been paid back on a loan so far. */
const loanRepaidIn = (tx: DbTx, loanId: number, loanType: 'lend' | 'borrow'): number => {
  const row = tx
    .select({ repaid: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
    .from(payments)
    .where(and(eq(payments.loanId, loanId), eq(payments.type, repaymentType(loanType))))
    .get();
  return row?.repaid ?? 0;
};

/**
 * True when a loan is marked repaid although its repayments don't cover the principal: the user
 * settled it by hand (a debt forgiven, or paid outside the app). Read it before a linked payment
 * changes and pass it to `syncLoanStatusIn`, which otherwise can't tell that from a stale status.
 */
const isLoanSettledByHandIn = (tx: DbTx, loanId: number | null | undefined): boolean => {
  if (loanId == null) return false;
  const loan = tx.select().from(loans).where(eq(loans.id, loanId)).get();
  if (!loan || loan.status !== 'repaid') return false;
  return loanOutstanding(loan.principal, loanRepaidIn(tx, loanId, loan.type)) > 0;
};

/**
 * Recomputes a loan's status from its repayments. Call after any payment linked to it changes.
 * A loan the user settled by hand stays repaid: editing a note on one of its payments must not
 * reopen it.
 */
export const syncLoanStatusIn = (tx: DbTx, loanId: number, settledByHand = false): void => {
  if (settledByHand) return;
  const loan = tx.select().from(loans).where(eq(loans.id, loanId)).get();
  if (!loan) return;
  const status = loanStatus(loan.principal, loanRepaidIn(tx, loanId, loan.type), loan.dueDate, new Date());
  if (status !== loan.status) {
    tx.update(loans).set({ status, updatedAt: new Date().toISOString() }).where(eq(loans.id, loanId)).run();
  }
};

/** Inserts a payment and applies it to balances (and its loan). The one way money enters the ledger. */
export const recordPaymentIn = (tx: DbTx, data: InsertPayment): Payment => {
  const entry: LedgerEntry = { type: data.type, amount: data.amount, accountId: data.accountId, toAccountId: data.toAccountId ?? null };
  validateEntry(entry);
  assertTransferAccounts(tx, entry);
  const settledByHand = isLoanSettledByHandIn(tx, data.loanId);
  const payment = tx.insert(payments).values(data).returning().get();
  applyDeltas(tx, accountDeltas(payment, 1));
  if (payment.loanId != null) syncLoanStatusIn(tx, payment.loanId, settledByHand);
  return payment;
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const createTransaction = async (data: InsertPayment): Promise<Payment> => {
  try {
    const payment = db.transaction((tx) => recordPaymentIn(tx, data));
    if (__DEV__) LoggerService.info('TRANSACTIONS', `Created transaction ${payment.id}`);
    return payment;
  } catch (err) {
    LoggerService.error('TRANSACTIONS', 'Failed to create transaction', { type: data.type, amount: data.amount }, err);
    throw err;
  }
};

export const deleteTransaction = async (id: number): Promise<void> => {
  try {
    db.transaction((tx) => {
      const payment = tx.select().from(payments).where(eq(payments.id, id)).get();
      if (!payment) return;
      const settledByHand = isLoanSettledByHandIn(tx, payment.loanId);
      tx.delete(payments).where(eq(payments.id, id)).run();
      applyDeltas(tx, accountDeltas(payment, -1));
      if (payment.loanId != null) syncLoanStatusIn(tx, payment.loanId, settledByHand);
    });
    if (__DEV__) LoggerService.info('TRANSACTIONS', `Deleted transaction ${id}`);
  } catch (err) {
    LoggerService.error('TRANSACTIONS', `Failed to delete transaction ${id}`, err);
    throw err;
  }
};

/** Reverses the old payment's effect and applies the new one, atomically. */
export const updateTransaction = async (id: number, data: UpdatePayment): Promise<Payment> => {
  const next: LedgerEntry = { type: data.type, amount: data.amount, accountId: data.accountId, toAccountId: data.toAccountId ?? null };
  // Before anything is written: a bad edit must not leave the old effect half-reversed.
  validateEntry(next);
  try {
    const updated = db.transaction((tx) => {
      const old = tx.select().from(payments).where(eq(payments.id, id)).get();
      if (!old) throw new LedgerError('Transaction not found');
      assertTransferAccounts(tx, next);
      const oldLoanSettledByHand = isLoanSettledByHandIn(tx, old.loanId);
      // An omitted `loanId` leaves the link as it was.
      const nextLoanId = data.loanId === undefined ? old.loanId : data.loanId;
      const newLoanSettledByHand = nextLoanId === old.loanId ? oldLoanSettledByHand : isLoanSettledByHandIn(tx, nextLoanId);
      applyDeltas(tx, accountDeltas(old, -1));
      const row = tx.update(payments).set(data).where(eq(payments.id, id)).returning().get();
      if (!row) throw new LedgerError('Transaction not found');
      applyDeltas(tx, accountDeltas(row, 1));
      if (row.loanId != null) {
        // The loan's own principal payment carries its principal: keep the two equal.
        const loan = tx.select({ type: loans.type, principal: loans.principal }).from(loans).where(eq(loans.id, row.loanId)).get();
        if (loan && isLoanPrincipal(row.type, loan.type) && loan.principal !== row.amount) {
          tx.update(loans).set({ principal: row.amount, updatedAt: new Date().toISOString() }).where(eq(loans.id, row.loanId)).run();
        }
        syncLoanStatusIn(tx, row.loanId, newLoanSettledByHand);
      }
      if (old.loanId != null && old.loanId !== row.loanId) syncLoanStatusIn(tx, old.loanId, oldLoanSettledByHand);
      return row;
    });
    if (__DEV__) LoggerService.info('TRANSACTIONS', `Updated transaction ${updated.id}`);
    return updated;
  } catch (err) {
    LoggerService.error('TRANSACTIONS', `Failed to update transaction ${id}`, { type: data.type, amount: data.amount }, err);
    throw err;
  }
};
