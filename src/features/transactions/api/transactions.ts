import { SQL, and, count, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { accounts, categories, payments } from '../../../db/schema';

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type UpdatePayment = Omit<InsertPayment, 'id'>;

export const PAGE_SIZE = 20;

export type TransactionFilters = {
  type?: 'CR' | 'DR';
  accountId?: number;
  categoryId?: number;
};

export type TransactionListItem = {
  id: number;
  accountId: number;
  categoryId: number;
  amount: number;
  type: 'CR' | 'DR';
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
};

export const TRANSACTION_LIST_SELECT = {
  id: payments.id,
  accountId: payments.accountId,
  categoryId: payments.categoryId,
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
  createdAt: payments.createdAt,
  updatedAt: payments.updatedAt,
} as const;

const buildWhere = (filters: TransactionFilters): SQL | undefined => {
  const conditions: SQL[] = [];
  if (filters.type) conditions.push(eq(payments.type, filters.type));
  if (filters.accountId != null) conditions.push(eq(payments.accountId, filters.accountId));
  if (filters.categoryId != null) conditions.push(eq(payments.categoryId, filters.categoryId));
  return conditions.length > 0 ? and(...conditions) : undefined;
};

export const getTransactionsPaged = async (
  page: number,
  filters: TransactionFilters = {},
) : Promise<TransactionListItem[]> => {
  const where = buildWhere(filters);

  const rows = await db
    .select(TRANSACTION_LIST_SELECT)
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .innerJoin(categories, eq(payments.categoryId, categories.id))
    .where(where)
    .orderBy(desc(payments.datetime))
    .limit(PAGE_SIZE)
    .offset(page * PAGE_SIZE);

  return rows;
};

export const getTransactionsCount = async (filters: TransactionFilters = {}) => {
  const where = buildWhere(filters);
  const [row] = await db.select({ total: count() }).from(payments).where(where);
  return row?.total ?? 0;
};

/** Fetch recent transactions with limit and optional filters */
export const getTransactions = async (limit: number = 10, filters: TransactionFilters = {}): Promise<TransactionListItem[]> => {
  const where = buildWhere(filters);
  const result = await db
    .select(TRANSACTION_LIST_SELECT)
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .innerJoin(categories, eq(payments.categoryId, categories.id))
    .where(where)
    .orderBy(desc(payments.datetime))
    .limit(limit);

  return result;
};

export const getTransactionById = async (id: number): Promise<Payment | null> => {
  const [payment] = await db
    .select({
      id: payments.id,
      accountId: payments.accountId,
      categoryId: payments.categoryId,
      amount: payments.amount,
      type: payments.type,
      datetime: payments.datetime,
      note: payments.note,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
    })
    .from(payments)
    .where(eq(payments.id, id))
    .limit(1);

  return payment ?? null;
};

export const createTransaction = async (data: InsertPayment) => {
  return await db.transaction(async (tx) => {
    const [payment] = await tx.insert(payments).values(data).returning();
    
    const balanceChange = data.type === 'CR' ? data.amount : -data.amount;
    const incomeChange = data.type === 'CR' ? data.amount : 0;
    const expenseChange = data.type === 'DR' ? data.amount : 0;

    await tx.update(accounts)
      .set({ 
        balance: sql`${accounts.balance} + ${balanceChange}`,
        income: sql`${accounts.income} + ${incomeChange}`,
        expense: sql`${accounts.expense} + ${expenseChange}`
      })
      .where(eq(accounts.id, data.accountId));
      
    return payment;
  });
};

export const deleteTransaction = async (id: number) => {
  return await db.transaction(async (tx) => {
    const [payment] = await tx.select().from(payments).where(eq(payments.id, id));
    if (!payment) return null;
    
    const balanceChange = payment.type === 'CR' ? -payment.amount : payment.amount;
    const incomeChange = payment.type === 'CR' ? -payment.amount : 0;
    const expenseChange = payment.type === 'DR' ? -payment.amount : 0;

    await tx.update(accounts)
      .set({ 
        balance: sql`${accounts.balance} + ${balanceChange}`,
        income: sql`${accounts.income} + ${incomeChange}`,
        expense: sql`${accounts.expense} + ${expenseChange}`
      })
      .where(eq(accounts.id, payment.accountId));
      
    return await tx.delete(payments).where(eq(payments.id, id));
  });
};

export const updateTransaction = async (id: number, data: UpdatePayment) => {
  return await db.transaction(async (tx) => {
    const [oldPayment] = await tx.select().from(payments).where(eq(payments.id, id));
    if (!oldPayment) throw new Error('Transaction not found');

    // Reverse old impact
    const oldBalanceChange = oldPayment.type === 'CR' ? -oldPayment.amount : oldPayment.amount;
    const oldIncomeChange = oldPayment.type === 'CR' ? -oldPayment.amount : 0;
    const oldExpenseChange = oldPayment.type === 'DR' ? -oldPayment.amount : 0;

    await tx.update(accounts)
      .set({ 
        balance: sql`${accounts.balance} + ${oldBalanceChange}`,
        income: sql`${accounts.income} + ${oldIncomeChange}`,
        expense: sql`${accounts.expense} + ${oldExpenseChange}`
      })
      .where(eq(accounts.id, oldPayment.accountId));

    // Apply new impact
    const newBalanceChange = data.type === 'CR' ? data.amount : -data.amount;
    const newIncomeChange = data.type === 'CR' ? data.amount : 0;
    const newExpenseChange = data.type === 'DR' ? data.amount : 0;

    await tx.update(accounts)
      .set({ 
        balance: sql`${accounts.balance} + ${newBalanceChange}`,
        income: sql`${accounts.income} + ${newIncomeChange}`,
        expense: sql`${accounts.expense} + ${newExpenseChange}`
      })
      .where(eq(accounts.id, data.accountId));

    const [updated] = await tx.update(payments).set(data).where(eq(payments.id, id)).returning();
    return updated;
  });
};
