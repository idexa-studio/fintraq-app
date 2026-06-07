import { and, desc, eq, sql, sum } from 'drizzle-orm';
import { db } from '../../../db/client';
import { accounts, payments, persons } from '../../../db/schema';

export type Person = typeof persons.$inferSelect;
export type InsertPerson = typeof persons.$inferInsert;
export type UpdatePersonData = Partial<Omit<InsertPerson, 'id' | 'createdAt' | 'updatedAt'>>;

export type PersonWithStats = Person & {
  totalSpent: number;
  totalReceived: number;
  txCount: number;
};

export type PersonSpend = {
  id: number;
  name: string;
  color: number;
  amount: number;
};

export const getPersons = async (): Promise<Person[]> => {
  return db.select().from(persons).orderBy(persons.name);
};

export const getPersonById = async (id: number): Promise<Person | undefined> => {
  const [result] = await db.select().from(persons).where(eq(persons.id, id));
  return result;
};

export const getPersonWithStats = async (id: number, currency?: string): Promise<PersonWithStats | undefined> => {
  const [person] = await db.select().from(persons).where(eq(persons.id, id));
  if (!person) return undefined;

  const statsQuery = db
    .select({
      totalSpent: sql<number>`SUM(CASE WHEN ${payments.type} = 'DR' THEN ${payments.amount} ELSE 0 END)`,
      totalReceived: sql<number>`SUM(CASE WHEN ${payments.type} = 'CR' THEN ${payments.amount} ELSE 0 END)`,
      txCount: sql<number>`COUNT(*)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(
      currency
        ? and(eq(payments.personId, id), eq(accounts.currency, currency))
        : eq(payments.personId, id)
    );

  const [stats] = await statsQuery;

  return {
    ...person,
    totalSpent: stats?.totalSpent ?? 0,
    totalReceived: stats?.totalReceived ?? 0,
    txCount: stats?.txCount ?? 0,
  };
};

export const getPersonsCount = async (): Promise<number> => {
  const [result] = await db.select({ count: sql<number>`COUNT(*)` }).from(persons);
  return result?.count ?? 0;
};

export const createPerson = async (data: InsertPerson): Promise<Person> => {
  const [result] = await db.insert(persons).values(data).returning();
  return result;
};

export const updatePerson = async (id: number, data: UpdatePersonData): Promise<Person> => {
  const [result] = await db
    .update(persons)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(persons.id, id))
    .returning();
  return result;
};

export const deletePerson = async (id: number): Promise<void> => {
  await db.delete(persons).where(eq(persons.id, id));
};

export const getTopPersonsBySpend = async (currency: string, limit = 5): Promise<PersonSpend[]> => {
  const result = await db
    .select({
      id: persons.id,
      name: persons.name,
      color: persons.color,
      amount: sum(payments.amount).mapWith(Number),
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .innerJoin(persons, eq(payments.personId, persons.id))
    .where(and(eq(accounts.currency, currency), eq(payments.type, 'DR')))
    .groupBy(persons.id)
    .orderBy(desc(sum(payments.amount)))
    .limit(limit);

  return result as PersonSpend[];
};

export const getPersonsNetByCurrency = async (currency: string): Promise<Map<number, number>> => {
  const rows = await db
    .select({
      id: persons.id,
      net: sql<number>`SUM(CASE WHEN ${payments.type} = 'CR' THEN ${payments.amount} WHEN ${payments.type} = 'DR' THEN -${payments.amount} ELSE 0 END)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .innerJoin(persons, eq(payments.personId, persons.id))
    .where(eq(accounts.currency, currency))
    .groupBy(persons.id);

  return new Map(rows.map(r => [r.id, r.net ?? 0]));
};

export const getPersonBreakdown = async (
  currency: string,
  days: number,
): Promise<PersonSpend[]> => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const result = await db
    .select({
      id: persons.id,
      name: persons.name,
      color: persons.color,
      amount: sum(payments.amount).mapWith(Number),
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .innerJoin(persons, eq(payments.personId, persons.id))
    .where(
      and(
        eq(accounts.currency, currency),
        eq(payments.type, 'DR'),
        sql`date(${payments.datetime}) >= ${cutoffStr}`,
      )
    )
    .groupBy(persons.id)
    .orderBy(desc(sum(payments.amount)));

  return result as PersonSpend[];
};

export type PersonTransaction = {
  id: number;
  amount: number;
  type: 'CR' | 'DR' | 'TR';
  datetime: string;
  note: string;
  categoryId: number;
  accountId: number;
};

export const getTransactionsByPerson = async (personId: number): Promise<PersonTransaction[]> => {
  const result = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      type: payments.type,
      datetime: payments.datetime,
      note: payments.note,
      categoryId: payments.categoryId,
      accountId: payments.accountId,
    })
    .from(payments)
    .where(eq(payments.personId, personId))
    .orderBy(desc(payments.datetime))
    .limit(50);

  return result as PersonTransaction[];
};
