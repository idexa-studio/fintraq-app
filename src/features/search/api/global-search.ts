import { desc, eq, like, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { db } from '@/src/db/client';
import { accounts, categories, payments } from '@/src/db/schema';
import type { Account } from '@/src/features/accounts/api/accounts';
import type { Category } from '@/src/features/categories/api/categories';
import { TRANSACTION_LIST_SELECT, type TransactionListItem } from '@/src/features/transactions/api/transactions';

const toAccounts = alias(accounts, 'to_accounts');

export interface GlobalSearchResults {
  query: string;
  transactions: TransactionListItem[];
  accounts: Account[];
  categories: Category[];
}

const searchTransactions = async (
  query: string,
  limit = 12,
): Promise<TransactionListItem[]> => {
  const q = `%${query}%`;
  const result = await db
    .select(TRANSACTION_LIST_SELECT)
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .innerJoin(categories, eq(payments.categoryId, categories.id))
    .leftJoin(toAccounts, eq(payments.toAccountId, toAccounts.id))
    .where(
      or(
        like(payments.note, q),
        like(accounts.name, q),
        like(categories.name, q),
      ),
    )
    .orderBy(desc(payments.datetime))
    .limit(limit);

  return result as TransactionListItem[];
};

const searchAccounts = async (query: string): Promise<Account[]> => {
  const q = `%${query}%`;
  return db
    .select()
    .from(accounts)
    .where(like(accounts.name, q))
    .limit(5);
};

const searchCategories = async (query: string): Promise<Category[]> => {
  const q = `%${query}%`;
  return db
    .select()
    .from(categories)
    .where(like(categories.name, q))
    .limit(10);
};

export const globalSearch = async (query: string): Promise<GlobalSearchResults> => {
  const trimmed = query.trim();
  const [txResults, acctResults, catResults] = await Promise.all([
    searchTransactions(trimmed),
    searchAccounts(trimmed),
    searchCategories(trimmed),
  ]);
  return { query: trimmed, transactions: txResults, accounts: acctResults, categories: catResults };
};
