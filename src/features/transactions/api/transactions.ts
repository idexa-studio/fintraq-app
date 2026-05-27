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
    return await db.transaction(async (tx) => {
      const [payment] = await tx.insert(payments).values(data).returning();

      if (data.type === 'TR') {
        if (data.toAccountId == null) throw new Error('Transfer requires toAccountId');
        if (__DEV__) console.log('[TX] transfer: debit accountId', data.accountId, 'credit accountId', data.toAccountId, 'amount', data.amount);
        await tx
          .update(accounts)
          .set({ balance: sql`${accounts.balance} - ${data.amount}` })
          .where(eq(accounts.id, data.accountId));
        await tx
          .update(accounts)
          .set({ balance: sql`${accounts.balance} + ${data.amount}` })
          .where(eq(accounts.id, data.toAccountId));
      } else {
        const balanceDelta = data.type === 'CR' ? data.amount : -data.amount;
        const incomeDelta = data.type === 'CR' ? data.amount : 0;
        const expenseDelta = data.type === 'DR' ? data.amount : 0;
        if (__DEV__) console.log('[TX] balance update: accountId', data.accountId, { balanceDelta, incomeDelta, expenseDelta });
        await tx
          .update(accounts)
          .set({
            balance: sql`${accounts.balance} + ${balanceDelta}`,
            income: sql`${accounts.income} + ${incomeDelta}`,
            expense: sql`${accounts.expense} + ${expenseDelta}`,
          })
          .where(eq(accounts.id, data.accountId));
      }

      return payment;
    });
  } catch (err) {
    console.error('[TX] createTransaction FAILED', { data, err });
    throw err;
  }
};

export const deleteTransaction = async (id: number) => {
  if (__DEV__) console.log('[TX] deleteTransaction id', id);
  try {
    return await db.transaction(async (tx) => {
      const [payment] = await tx.select().from(payments).where(eq(payments.id, id));
      if (!payment) {
        if (__DEV__) console.warn('[TX] deleteTransaction: payment not found id', id);
        return null;
      }
      if (__DEV__) console.log('[TX] deleting payment', { type: payment.type, amount: payment.amount, accountId: payment.accountId, toAccountId: payment.toAccountId });

      if (payment.type === 'TR') {
        if (payment.toAccountId != null) {
          await tx
            .update(accounts)
            .set({ balance: sql`${accounts.balance} + ${payment.amount}` })
            .where(eq(accounts.id, payment.accountId));
          await tx
            .update(accounts)
            .set({ balance: sql`${accounts.balance} - ${payment.amount}` })
            .where(eq(accounts.id, payment.toAccountId));
        }
      } else {
        const balanceDelta = payment.type === 'CR' ? -payment.amount : payment.amount;
        const incomeDelta = payment.type === 'CR' ? -payment.amount : 0;
        const expenseDelta = payment.type === 'DR' ? -payment.amount : 0;
        await tx
          .update(accounts)
          .set({
            balance: sql`${accounts.balance} + ${balanceDelta}`,
            income: sql`${accounts.income} + ${incomeDelta}`,
            expense: sql`${accounts.expense} + ${expenseDelta}`,
          })
          .where(eq(accounts.id, payment.accountId));
      }

      return await tx.delete(payments).where(eq(payments.id, id));
    });
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
  return await db.transaction(async (tx) => {
    const [old] = await tx.select().from(payments).where(eq(payments.id, id));
    if (!old) throw new Error('Transaction not found');
    if (__DEV__) console.log('[TX] old payment', { type: old.type, amount: old.amount, accountId: old.accountId, toAccountId: old.toAccountId });

    // Reverse old impact
    if (old.type === 'TR') {
      if (old.toAccountId != null) {
        await tx
          .update(accounts)
          .set({ balance: sql`${accounts.balance} + ${old.amount}` })
          .where(eq(accounts.id, old.accountId));
        await tx
          .update(accounts)
          .set({ balance: sql`${accounts.balance} - ${old.amount}` })
          .where(eq(accounts.id, old.toAccountId));
      }
    } else {
      const balanceDelta = old.type === 'CR' ? -old.amount : old.amount;
      const incomeDelta = old.type === 'CR' ? -old.amount : 0;
      const expenseDelta = old.type === 'DR' ? -old.amount : 0;
      await tx
        .update(accounts)
        .set({
          balance: sql`${accounts.balance} + ${balanceDelta}`,
          income: sql`${accounts.income} + ${incomeDelta}`,
          expense: sql`${accounts.expense} + ${expenseDelta}`,
        })
        .where(eq(accounts.id, old.accountId));
    }

    // Apply new impact
    if (data.type === 'TR') {
      if (data.toAccountId == null) throw new Error('Transfer requires toAccountId');
      await tx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${data.amount}` })
        .where(eq(accounts.id, data.accountId));
      await tx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${data.amount}` })
        .where(eq(accounts.id, data.toAccountId));
    } else {
      const balanceDelta = data.type === 'CR' ? data.amount : -data.amount;
      const incomeDelta = data.type === 'CR' ? data.amount : 0;
      const expenseDelta = data.type === 'DR' ? data.amount : 0;
      await tx
        .update(accounts)
        .set({
          balance: sql`${accounts.balance} + ${balanceDelta}`,
          income: sql`${accounts.income} + ${incomeDelta}`,
          expense: sql`${accounts.expense} + ${expenseDelta}`,
        })
        .where(eq(accounts.id, data.accountId));
    }

    const [updated] = await tx.update(payments).set(data).where(eq(payments.id, id)).returning();
    if (__DEV__) console.log('[TX] updateTransaction success id', updated.id);
    return updated;
  });
  } catch (err) {
    console.error('[TX] updateTransaction FAILED', { id, data, err });
    throw err;
  }
};
