import { eq, or } from 'drizzle-orm';
import { db } from '../../../db/client';
import { accounts, payments, loans } from '../../../db/schema';

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/** Fields allowed to be mutated via the account form. Financial fields are intentionally excluded
 *  — balance, income, and expense are owned exclusively by transaction mutations. */
export type UpdateAccountData = Partial<
  Omit<InsertAccount, 'balance' | 'income' | 'expense'>
>;

export const getAccounts = async (): Promise<Account[]> => {
  return await db.select().from(accounts);
};

export const createAccount = async (data: InsertAccount) => {
  const result = await db.insert(accounts).values(data).returning();
  return result[0];
};

export const updateAccount = async (id: number, data: UpdateAccountData) => {
  const result = await db.update(accounts).set(data).where(eq(accounts.id, id)).returning();
  return result[0];
};

export const getAccountById = async (id: number): Promise<Account | undefined> => {
  const result = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
  return result[0];
};

export const deleteAccount = async (id: number) => {
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, id))
    .limit(1);

  if (!account) {
    throw new Error('Account not found.');
  }

  // Check if payments table references this account as accountId or toAccountId
  const [linkedPayment] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(or(eq(payments.accountId, id), eq(payments.toAccountId, id)))
    .limit(1);

  if (linkedPayment) {
    throw new Error('This account is linked to transactions and cannot be deleted.');
  }

  // Check if loans table references this account
  const [linkedLoan] = await db
    .select({ id: loans.id })
    .from(loans)
    .where(eq(loans.accountId, id))
    .limit(1);

  if (linkedLoan) {
    throw new Error('This account is linked to loans and cannot be deleted.');
  }

  return await db.delete(accounts).where(eq(accounts.id, id));
};
