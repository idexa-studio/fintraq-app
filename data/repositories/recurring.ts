import { db } from '@/data/db/client';
import { accounts, categories, payments, persons, recurringRules } from '@/data/db/schema';
import type { DbTx, Payment } from '@/data/repositories/transactions';
import { recordPaymentIn } from '@/data/repositories/transactions';
import { and, count, desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

/**
 * Repeating items (release 2.1.0). This file only reads and writes them; when an item is due and
 * what its next day is are worked out by the rules in `features/recurring`, and passed in.
 */

export type RecurringRule = typeof recurringRules.$inferSelect;
export type NewRecurringRule = Omit<typeof recurringRules.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>;

type Named = { name: string; icon: string; color: number } | null;

/** An item with what it points at, for lists and its page. A null part was deleted: the item has stopped. */
export type RecurringRuleView = RecurringRule & {
  account: (Named & { currency: string }) | null;
  toAccount: Named;
  category: Named;
  person: { name: string; color: number } | null;
};

const toAccounts = alias(accounts, 'to_accounts');

const named = (name: string | null, icon: string | null, color: number | null): Named => (name === null ? null : { name, icon: icon ?? 'tag', color: color ?? 0 });

/** Every item, oldest first, with the names of what it points at. */
export const getRecurringRules = async (): Promise<RecurringRuleView[]> => {
  const rows = await db
    .select({
      rule: recurringRules,
      accountName: accounts.name, accountIcon: accounts.icon, accountColor: accounts.color, accountCurrency: accounts.currency,
      toName: toAccounts.name, toIcon: toAccounts.icon, toColor: toAccounts.color,
      categoryName: categories.name, categoryIcon: categories.icon, categoryColor: categories.color,
      personName: persons.name, personColor: persons.color,
    })
    .from(recurringRules)
    .leftJoin(accounts, eq(recurringRules.accountId, accounts.id))
    .leftJoin(toAccounts, eq(recurringRules.toAccountId, toAccounts.id))
    .leftJoin(categories, eq(recurringRules.categoryId, categories.id))
    .leftJoin(persons, eq(recurringRules.personId, persons.id))
    .orderBy(recurringRules.createdAt, recurringRules.id);
  return rows.map((r) => ({
    ...r.rule,
    account: r.accountName === null ? null : { ...named(r.accountName, r.accountIcon, r.accountColor)!, currency: r.accountCurrency ?? '' },
    toAccount: named(r.toName, r.toIcon, r.toColor),
    category: named(r.categoryName, r.categoryIcon, r.categoryColor),
    person: r.personName === null ? null : { name: r.personName, color: r.personColor ?? 0 },
  }));
};

export const getRecurringRule = async (id: number): Promise<RecurringRuleView | null> =>
  (await getRecurringRules()).find((rule) => rule.id === id) ?? null;

/** How many items there are, for the free plan's limit. */
export const countRecurringRules = async (): Promise<number> => {
  const [row] = await db.select({ value: count() }).from(recurringRules);
  return row?.value ?? 0;
};

export const createRecurringRule = async (data: NewRecurringRule): Promise<RecurringRule> => {
  const [row] = await db.insert(recurringRules).values(data).returning();
  return row!;
};

/** Changes what an item makes from now on; the transactions it made already stay as they are. */
export const updateRecurringRule = async (id: number, data: Partial<NewRecurringRule>): Promise<RecurringRule | undefined> => {
  const [row] = await db.update(recurringRules).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(recurringRules.id, id)).returning();
  return row;
};

/**
 * Deletes an item and keeps every transaction it made, which from then on were made by no item.
 * One transaction, so a failure leaves both as they were.
 */
export const deleteRecurringRule = async (id: number): Promise<void> => {
  db.transaction((tx) => {
    tx.update(payments).set({ recurringRuleId: null, recurringDate: null }).where(eq(payments.recurringRuleId, id)).run();
    tx.delete(recurringRules).where(eq(recurringRules.id, id)).run();
  });
};

/** The transactions an item has made, newest first. */
export const getTransactionsMadeBy = async (id: number): Promise<Payment[]> =>
  db.select().from(payments).where(eq(payments.recurringRuleId, id)).orderBy(desc(payments.datetime), desc(payments.id));

/** Where an item stands after one occurrence, made or skipped: worked out by the rules. */
export type Advance = { nextDue: string; occurrences: number };

const advanceIn = (tx: DbTx, id: number, to: Advance): void => {
  tx.update(recurringRules).set({ nextDue: to.nextDue, occurrences: to.occurrences, updatedAt: new Date().toISOString() }).where(eq(recurringRules.id, id)).run();
};

/** The transaction made for one occurrence: the item's fields, possibly with the amount changed on Add. */
export type Occurrence = {
  ruleId: number;
  /** The day it is for (YYYY-MM-DD). */
  date: string;
  payment: Omit<typeof payments.$inferInsert, 'id' | 'recurringRuleId' | 'recurringDate' | 'createdAt' | 'updatedAt'>;
  then: Advance;
};

/**
 * Records one occurrence through the ledger, as a typed transaction is, and moves the item on, in
 * one transaction. An occurrence already made is not made again: it is only moved past, so a
 * catch-up run twice (two launches at once, a retry) cannot double a bill.
 */
export const recordOccurrence = async ({ ruleId, date, payment, then }: Occurrence): Promise<Payment | null> =>
  db.transaction((tx) => {
    const made = tx.select({ id: payments.id }).from(payments).where(and(eq(payments.recurringRuleId, ruleId), eq(payments.recurringDate, date))).get();
    const row = made ? null : recordPaymentIn(tx, { ...payment, recurringRuleId: ruleId, recurringDate: date });
    advanceIn(tx, ruleId, then);
    return row;
  });

/** Lets one occurrence of an asked item pass without a transaction. */
export const skipOccurrence = async (ruleId: number, then: Advance): Promise<void> => {
  db.transaction((tx) => advanceIn(tx, ruleId, then));
};
