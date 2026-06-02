import { SQL, and, count, desc, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { db } from '../../../db/client';
import { accounts, categories, payments } from '../../../db/schema';
import type { TransactionType } from '../../../types';

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type UpdatePayment = Omit<InsertPayment, 'id'>;

export const PAGE_SIZE = 20;

export type TransactionFilters = {
  type?: TransactionType;
  accountId?: number;
  categoryId?: number;
};

const toAccounts = alias(accounts, 'to_accounts');

export type TransactionListItem = {
  id: number;
  accountId: number;
  categoryId: number;
  toAccountId: number | null;
  amount: number;
  type: TransactionType;
  datetime: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  account: {
    id: number;
    name: string;
    currency: string;
    color: number;
  };
  category: {
    id: number;
    name: string;
    icon: string;
    color: number;
  };
  toAccount: {
    id: number | null;
    name: string | null;
    currency: string | null;
    color: number | null;
  };
};

export const TRANSACTION_LIST_SELECT = {
  id: payments.id,
  accountId: payments.accountId,
  categoryId: payments.categoryId,
  toAccountId: payments.toAccountId,
  amount: payments.amount,
  type: payments.type,
  datetime: payments.datetime,
  note: payments.note,
  account: {
    id: accounts.id,
    name: accounts.name,
    currency: accounts.currency,
    color: accounts.color,
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
  },
  createdAt: payments.createdAt,
  updatedAt: payments.updatedAt,
} as const;

const buildWhere = (filters: TransactionFilters): SQL | undefined => {
  const conditions: SQL[] = [];
  if (filters.type) conditions.push(eq(payments.type, filters.type));
  if (filters.accountId != null) {
    conditions.push(
      sql`(${eq(payments.accountId, filters.accountId)} OR ${payments.toAccountId} = ${filters.accountId})`,
    );
  }
  if (filters.categoryId != null) conditions.push(eq(payments.categoryId, filters.categoryId));
  return conditions.length > 0 ? and(...conditions) : undefined;
};

export const getTransactionsPaged = async (
  page: number,
  filters: TransactionFilters = {},
): Promise<TransactionListItem[]> => {
  if (__DEV__) console.log('[TX] getTransactionsPaged', { page, filters });
  try {
    const where = buildWhere(filters);
    const rows = await db
      .select(TRANSACTION_LIST_SELECT)
      .from(payments)
      .innerJoin(accounts, eq(payments.accountId, accounts.id))
      .innerJoin(categories, eq(payments.categoryId, categories.id))
      .leftJoin(toAccounts, eq(payments.toAccountId, toAccounts.id))
      .where(where)
      .orderBy(desc(payments.datetime))
      .limit(PAGE_SIZE)
      .offset(page * PAGE_SIZE);
    if (__DEV__) console.log('[TX] getTransactionsPaged returned', rows.length, 'rows');
    return rows as TransactionListItem[];
  } catch (err) {
    console.error('[TX] getTransactionsPaged FAILED', { page, filters, err });
    throw err;
  }
};

export const getTransactionsCount = async (filters: TransactionFilters = {}) => {
  const where = buildWhere(filters);
  const [row] = await db.select({ total: count() }).from(payments).where(where);
  return row?.total ?? 0;
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

  return result as TransactionListItem[];
};

export const getTransactionById = async (id: number): Promise<Payment | null> => {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, id))
    .limit(1);

  return payment ?? null;
};

// ─── Account balance helpers ──────────────────────────────────────────────────

const applyBalanceDelta = async (
  accountId: number,
  type: TransactionType,
  amount: number,
  direction: 1 | -1,
): Promise<void> => {
  if (type === 'TR') {
    await db
      .update(accounts)
      .set({ balance: sql`${accounts.balance} + ${direction * amount}` })
      .where(eq(accounts.id, accountId));
    return;
  }

  const sign = type === 'CR' ? 1 : -1;
  const balanceDelta = sign * direction * amount;
  const incomeDelta  = type === 'CR' ? direction * amount : 0;
  const expenseDelta = type === 'DR' ? direction * amount : 0;

  await db
    .update(accounts)
    .set({
      balance: sql`${accounts.balance} + ${balanceDelta}`,
      income:  sql`${accounts.income}  + ${incomeDelta}`,
      expense: sql`${accounts.expense} + ${expenseDelta}`,
    })
    .where(eq(accounts.id, accountId));
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const createTransaction = async (data: InsertPayment): Promise<Payment> => {
  if (__DEV__) {
    console.log('[TX] createTransaction', {
      type: data.type,
      amount: data.amount,
      accountId: data.accountId,
      toAccountId: data.toAccountId,
      categoryId: data.categoryId,
    });
  }
  try {
    const [payment] = await db.insert(payments).values(data).returning();

    if (data.type === 'TR') {
      if (data.toAccountId == null) throw new Error('Transfer requires toAccountId');
      // Debit source, credit destination
      await applyBalanceDelta(data.accountId, 'TR', data.amount, -1);
      await applyBalanceDelta(data.toAccountId, 'TR', data.amount, 1);
    } else {
      await applyBalanceDelta(data.accountId, data.type, data.amount, 1);
    }

    if (__DEV__) console.log('[TX] createTransaction success id', payment.id);
    return payment;
  } catch (err) {
    console.error('[TX] createTransaction FAILED', { data, err });
    throw err;
  }
};

export const deleteTransaction = async (id: number): Promise<void> => {
  if (__DEV__) console.log('[TX] deleteTransaction id', id);
  try {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    if (!payment) {
      if (__DEV__) console.warn('[TX] deleteTransaction: payment not found id', id);
      return;
    }

    await db.delete(payments).where(eq(payments.id, id));

    if (payment.type === 'TR') {
      if (payment.toAccountId != null) {
        // Reverse: credit source back, debit destination back
        await applyBalanceDelta(payment.accountId, 'TR', payment.amount, 1);
        await applyBalanceDelta(payment.toAccountId, 'TR', payment.amount, -1);
      }
    } else {
      await applyBalanceDelta(payment.accountId, payment.type, payment.amount, -1);
    }

    if (__DEV__) console.log('[TX] deleteTransaction success id', id);
  } catch (err) {
    console.error('[TX] deleteTransaction FAILED', { id, err });
    throw err;
  }
};

export const updateTransaction = async (id: number, data: UpdatePayment): Promise<Payment> => {
  if (__DEV__) {
    console.log('[TX] updateTransaction id', id, {
      newType: data.type,
      newAmount: data.amount,
      newAccountId: data.accountId,
      newToAccountId: data.toAccountId,
    });
  }
  try {
    const [old] = await db.select().from(payments).where(eq(payments.id, id));
    if (!old) throw new Error('Transaction not found');

    // Reverse old impact
    if (old.type === 'TR') {
      if (old.toAccountId != null) {
        await applyBalanceDelta(old.accountId, 'TR', old.amount, 1);
        await applyBalanceDelta(old.toAccountId, 'TR', old.amount, -1);
      }
    } else {
      await applyBalanceDelta(old.accountId, old.type, old.amount, -1);
    }

    // Apply new impact
    if (data.type === 'TR') {
      if (data.toAccountId == null) throw new Error('Transfer requires toAccountId');
      await applyBalanceDelta(data.accountId, 'TR', data.amount, -1);
      await applyBalanceDelta(data.toAccountId, 'TR', data.amount, 1);
    } else {
      await applyBalanceDelta(data.accountId, data.type, data.amount, 1);
    }

    const [updated] = await db.update(payments).set(data).where(eq(payments.id, id)).returning();
    if (__DEV__) console.log('[TX] updateTransaction success id', updated.id);
    return updated;
  } catch (err) {
    console.error('[TX] updateTransaction FAILED', { id, data, err });
    throw err;
  }
};
