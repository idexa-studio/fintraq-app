import { eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { accounts } from '../../../db/schema';

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

export const deleteAccount = async (id: number) => {
  return await db.delete(accounts).where(eq(accounts.id, id));
};
