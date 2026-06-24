import { InferSelectModel, eq, sql } from 'drizzle-orm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../db/client';
import { accounts, categories, payments, persons, loans } from '../db/schema';
import { toDbColor } from './format';
import { StorageKeys } from '../constants/keys';

// ─── Seed accounts ────────────────────────────────────────────────────────────

const SEED_ACCOUNTS = [
  // USD – multiple accounts, same currency
  {
    name: 'Chase Checking',
    holderName: 'Alex Morgan',
    accountNumber: '••••  4821',
    accountType: 'bank' as const,
    currency: 'USD',
    color: toDbColor('#2563EB'),
    isDefault: true,
  },
  {
    name: 'Chase Savings',
    holderName: 'Alex Morgan',
    accountNumber: '••••  7203',
    accountType: 'savings' as const,
    currency: 'USD',
    color: toDbColor('#0EA5E9'),
    isDefault: false,
  },
  {
    name: 'Amex Gold',
    holderName: 'Alex Morgan',
    accountNumber: '••••  5511',
    accountType: 'credit_card' as const,
    currency: 'USD',
    color: toDbColor('#D97706'),
    isDefault: false,
  },
  {
    name: 'Robinhood',
    holderName: 'Alex Morgan',
    accountNumber: 'AMG-9341',
    accountType: 'investment' as const,
    currency: 'USD',
    color: toDbColor('#10B981'),
    isDefault: false,
  },
  // EUR
  {
    name: 'Revolut',
    holderName: 'Alex Morgan',
    accountNumber: 'REV-EU-0032',
    accountType: 'ewallet' as const,
    currency: 'EUR',
    color: toDbColor('#6D28D9'),
    isDefault: false,
  },
  // GBP
  {
    name: 'Monzo',
    holderName: 'Alex Morgan',
    accountNumber: '••••  3870',
    accountType: 'bank' as const,
    currency: 'GBP',
    color: toDbColor('#DB2777'),
    isDefault: false,
  },
  // INR – multiple accounts, same currency
  {
    name: 'HDFC Bank',
    holderName: 'Alex Morgan',
    accountNumber: '••••  9914',
    accountType: 'bank' as const,
    currency: 'INR',
    color: toDbColor('#EA580C'),
    isDefault: false,
  },
  {
    name: 'Paytm Wallet',
    holderName: 'Alex Morgan',
    accountNumber: '+91 98765 43210',
    accountType: 'ewallet' as const,
    currency: 'INR',
    color: toDbColor('#0284C7'),
    isDefault: false,
  },
  // SGD
  {
    name: 'DBS Bank',
    holderName: 'Alex Morgan',
    accountNumber: '••••  1156',
    accountType: 'bank' as const,
    currency: 'SGD',
    color: toDbColor('#DC2626'),
    isDefault: false,
  },
  // Cash wallet
  {
    name: 'Cash Wallet',
    holderName: 'Alex Morgan',
    accountNumber: 'CASH',
    accountType: 'cash' as const,
    currency: 'USD',
    color: toDbColor('#059669'),
    isDefault: false,
  },
];

// ─── Seed persons ─────────────────────────────────────────────────────────────

const SEED_PERSONS = [
  { name: 'Sarah Mitchell', email: 'sarah.m@example.com', phone: '+1 555 0101', designation: 'Product Manager', company: 'Acme Corp',  color: toDbColor('#059669') },
  { name: 'James Okafor',  email: 'james.o@example.com', phone: '+1 555 0102', designation: 'Engineer',         company: 'TechFlow',  color: toDbColor('#2563EB') },
  { name: 'Priya Nair',    email: 'priya.n@example.com', phone: '+1 555 0103', designation: 'Designer',         company: 'Pixel Lab',  color: toDbColor('#6D28D9') },
  { name: 'Tom Reyes',     email: 'tom.r@example.com',   phone: '+1 555 0104', designation: 'CFO',              company: 'Reyes Co',   color: toDbColor('#EA580C') },
] as const;

// ─── Currency scaling ─────────────────────────────────────────────────────────

const CURRENCY_MULTIPLIERS: Record<string, number> = {
  USD: 1,    EUR: 0.92,  GBP: 0.79,  INR: 83,    JPY: 151,
  KRW: 1340, IDR: 15800, VND: 24700, AED: 3.67,  SAR: 3.75,
  CAD: 1.36, AUD: 1.52,  BRL: 5.0,   MXN: 16.7,  TRY: 32.2,
  SGD: 1.35, HKD: 7.82,  CHF: 0.90,  NOK: 10.6,  SEK: 10.4,
};

// ─── Realistic note pools ─────────────────────────────────────────────────────

const INCOME_NOTES = [
  'Salary Credit — May',
  'Freelance Invoice #2041',
  'Client Payment — Acme Corp',
  'Dividend Payout',
  'Consulting Fee',
  'Bonus — Q2 Performance',
  'Interest Credit',
  'Rental Income',
];

const EXPENSE_NOTES: Record<string, string[]> = {
  food: ['Whole Foods Market', 'Chipotle', 'Trader Joe\'s', 'McDonald\'s', 'Starbucks', 'Local Bakery', 'Sushi Takeout', 'Pizza Delivery'],
  transport: ['Uber Ride', 'Lyft', 'Gas Station — Shell', 'Subway Pass', 'Parking Fee', 'Flight Ticket', 'Taxi Fare'],
  shopping: ['Amazon Purchase', 'Zara', 'IKEA', 'Target', 'Best Buy', 'Apple Store', 'H&M', 'Nike'],
  utilities: ['Electricity Bill', 'Internet — AT&T', 'Water Bill', 'Phone Bill', 'Gas Bill'],
  health: ['CVS Pharmacy', 'Gym Membership', 'Doctor Visit Copay', 'Dental Checkup', 'Vitamins & Supplements'],
  entertainment: ['Netflix Subscription', 'Spotify Premium', 'Movie Tickets', 'Steam Purchase', 'Concert Tickets', 'YouTube Premium'],
  housing: ['Monthly Rent', 'Airbnb Stay', 'Home Insurance', 'Maintenance & Repairs'],
  other: ['ATM Withdrawal', 'Bank Fee', 'Miscellaneous', 'Gift for Friend', 'Online Course', 'Donation'],
};

const ALL_EXPENSE_NOTES = Object.values(EXPENSE_NOTES).flat();

type Category = InferSelectModel<typeof categories>;

type SeedContext = {
  accountId: number;
  multiplier: number;
  incomeCategories: Category[];
  expenseCategories: Category[];
  transferCategories: Category[];
  now: Date;
};

// ─── Transaction generators ───────────────────────────────────────────────────

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSalary(monthDate: Date, ctx: SeedContext) {
  const base = randInt(3500, 7000);
  const amount = Math.round(base * ctx.multiplier);
  const date = new Date(monthDate);
  date.setDate(randInt(1, 5));
  const note = randFrom(INCOME_NOTES);

  return {
    accountId: ctx.accountId,
    categoryId: randFrom(ctx.incomeCategories).id,
    amount,
    type: 'CR' as const,
    datetime: date.toISOString(),
    note,
  };
}

function generateRent(monthDate: Date, ctx: SeedContext) {
  const base = randInt(900, 2200);
  const amount = Math.round(base * ctx.multiplier);
  const date = new Date(monthDate);
  date.setDate(1);

  const rentCat = ctx.expenseCategories.find(c => {
    const n = c.name.toLowerCase();
    return n.includes('rent') || n.includes('hous') || n.includes('home');
  }) ?? ctx.expenseCategories[0];

  return {
    accountId: ctx.accountId,
    categoryId: rentCat.id,
    amount,
    type: 'DR' as const,
    datetime: date.toISOString(),
    note: 'Monthly Rent Payment',
  };
}

function generateExpenses(monthDate: Date, ctx: SeedContext, isCurrentMonth: boolean) {
  const count = randInt(8, 18);
  const maxDay = isCurrentMonth ? ctx.now.getDate() : 28;
  const result = [];

  for (let i = 0; i < count; i++) {
    const base = randInt(4, 220);
    const amount = Math.round(base * ctx.multiplier);
    const date = new Date(monthDate);
    date.setDate(randInt(1, maxDay));

    const cat = randFrom(ctx.expenseCategories);
    const note = randFrom(ALL_EXPENSE_NOTES);

    result.push({
      accountId: ctx.accountId,
      categoryId: cat.id,
      amount,
      type: 'DR' as const,
      datetime: date.toISOString(),
      note,
    });
  }

  return result;
}

function generateOccasionalIncome(monthDate: Date, ctx: SeedContext) {
  // 35% chance of a second income event (freelance, dividend, etc.)
  if (Math.random() > 0.35) return null;

  const base = randInt(200, 1500);
  const amount = Math.round(base * ctx.multiplier);
  const date = new Date(monthDate);
  date.setDate(randInt(8, 25));

  return {
    accountId: ctx.accountId,
    categoryId: randFrom(ctx.incomeCategories).id,
    amount,
    type: 'CR' as const,
    datetime: date.toISOString(),
    note: randFrom(['Freelance Invoice #' + randInt(1000, 9999), 'Dividend Payout', 'Referral Bonus', 'Side Project Income']),
  };
}

// ─── Demo loan seeder (standalone — can run independently of the main seed) ───

type InsertedPerson = { id: number };
type InsertedAccount = { id: number; currency: string };
type InsertedCategory = { id: number; name: string };

/**
 * Inserts 5 realistic demo loans with repayment history.
 * Safe to call from the main seed OR standalone from the developer screen.
 * Skips silently if loans already exist so it's idempotent.
 */
export async function seedDemoLoans(
  seedPersons?: InsertedPerson[],
  seedAccounts?: InsertedAccount[],
  seedCategories?: InsertedCategory[],
): Promise<number> {
  const allPersons  = seedPersons   ?? await db.select({ id: persons.id }).from(persons);
  const allAccounts = seedAccounts  ?? await db.select({ id: accounts.id, currency: accounts.currency }).from(accounts);
  const allCategories = seedCategories ?? await db.select({ id: categories.id, name: categories.name }).from(categories);

  if (allPersons.length < 3 || allAccounts.length === 0) {
    throw new Error('Need ≥3 persons and ≥1 account. Run the main seed first.');
  }

  if (!allCategories.length) {
    throw new Error('No categories found. Complete onboarding first.');
  }

  // Idempotency: skip if any loans already exist
  const [existing] = await db.select({ id: loans.id }).from(loans).limit(1);
  if (existing) return 0;

  const usdAccount = allAccounts.find(a => a.currency === 'USD') ?? allAccounts[0];
  const m = CURRENCY_MULTIPLIERS[usdAccount.currency.toUpperCase()] ?? 1;
  const loanCategory =
    allCategories.find(c => c.name.toLowerCase() === 'loan/emi') ??
    allCategories.find(c => c.name.toLowerCase() === 'uncategorized') ??
    allCategories[0];

  const now = new Date();
  const daysAgo    = (d: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - d).toISOString();
  const daysFromNow = (d: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + d).toISOString().slice(0, 10);
  const daysAgoDate = (d: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - d).toISOString().slice(0, 10);

  const p = allPersons;
  const p3 = p[3 < p.length ? 3 : 0];

  const seededLoans = await db.insert(loans).values([
    // Lent $800 to person[0] — active, partial repayment
    { personId: p[0].id, type: 'lend'   as const, principal: Math.round(800  * m), currency: usdAccount.currency, accountId: usdAccount.id, categoryId: loanCategory.id, status: 'active' as const, dueDate: daysFromNow(28),  note: 'Emergency medical expenses', createdAt: daysAgo(40), updatedAt: daysAgo(10) },
    // Borrowed $2400 from person[1] — active, partial repayment
    { personId: p[1].id, type: 'borrow' as const, principal: Math.round(2400 * m), currency: usdAccount.currency, accountId: usdAccount.id, categoryId: loanCategory.id, status: 'active' as const, dueDate: daysFromNow(55),  note: 'MacBook Pro purchase',       createdAt: daysAgo(60), updatedAt: daysAgo(5)  },
    // Lent $350 to person[2] — overdue, no repayment
    { personId: p[2].id, type: 'lend'   as const, principal: Math.round(350  * m), currency: usdAccount.currency, accountId: usdAccount.id, categoryId: loanCategory.id, status: 'active' as const, dueDate: daysAgoDate(10), note: 'Helped with rent shortfall', createdAt: daysAgo(45), updatedAt: daysAgo(45) },
    // Lent $200 to person[3] — fully repaid
    { personId: p3.id,   type: 'lend'   as const, principal: Math.round(200  * m), currency: usdAccount.currency, accountId: usdAccount.id, categoryId: loanCategory.id, status: 'repaid' as const,                           note: 'Conference ticket split',   createdAt: daysAgo(75), updatedAt: daysAgo(20) },
    // Borrowed $600 from person[0] — fully repaid
    { personId: p[0].id, type: 'borrow' as const, principal: Math.round(600  * m), currency: usdAccount.currency, accountId: usdAccount.id, categoryId: loanCategory.id, status: 'repaid' as const,                           note: 'Bridged gap before salary', createdAt: daysAgo(90), updatedAt: daysAgo(35) },
  ]).returning();

  type PaymentRow = { accountId: number; categoryId: number; personId: number | null; loanId: number; amount: number; type: 'CR' | 'DR'; datetime: string; note: string; createdAt: string; updatedAt: string };
  const loanPayments: PaymentRow[] = [
    { accountId: usdAccount.id, categoryId: loanCategory.id, personId: p[0].id, loanId: seededLoans[0].id, amount: Math.round(800  * m), type: 'DR', datetime: daysAgo(40), note: 'Lent to Sarah',              createdAt: daysAgo(40), updatedAt: daysAgo(40) },
    { accountId: usdAccount.id, categoryId: loanCategory.id, personId: p[0].id, loanId: seededLoans[0].id, amount: Math.round(250  * m), type: 'CR', datetime: daysAgo(10), note: 'Partial repayment from Sarah', createdAt: daysAgo(10), updatedAt: daysAgo(10) },
    { accountId: usdAccount.id, categoryId: loanCategory.id, personId: p[1].id, loanId: seededLoans[1].id, amount: Math.round(2400 * m), type: 'CR', datetime: daysAgo(60), note: 'Received from James',          createdAt: daysAgo(60), updatedAt: daysAgo(60) },
    { accountId: usdAccount.id, categoryId: loanCategory.id, personId: p[1].id, loanId: seededLoans[1].id, amount: Math.round(800  * m), type: 'DR', datetime: daysAgo(5),  note: 'Repayment to James',           createdAt: daysAgo(5),  updatedAt: daysAgo(5)  },
    { accountId: usdAccount.id, categoryId: loanCategory.id, personId: p[2].id, loanId: seededLoans[2].id, amount: Math.round(350  * m), type: 'DR', datetime: daysAgo(45), note: 'Lent to Priya',               createdAt: daysAgo(45), updatedAt: daysAgo(45) },
    { accountId: usdAccount.id, categoryId: loanCategory.id, personId: p3.id,   loanId: seededLoans[3].id, amount: Math.round(200  * m), type: 'DR', datetime: daysAgo(75), note: 'Lent to Tom',                 createdAt: daysAgo(75), updatedAt: daysAgo(75) },
    { accountId: usdAccount.id, categoryId: loanCategory.id, personId: p3.id,   loanId: seededLoans[3].id, amount: Math.round(200  * m), type: 'CR', datetime: daysAgo(20), note: 'Full repayment from Tom',      createdAt: daysAgo(20), updatedAt: daysAgo(20) },
    { accountId: usdAccount.id, categoryId: loanCategory.id, personId: p[0].id, loanId: seededLoans[4].id, amount: Math.round(600  * m), type: 'CR', datetime: daysAgo(90), note: 'Received from Sarah',          createdAt: daysAgo(90), updatedAt: daysAgo(90) },
    { accountId: usdAccount.id, categoryId: loanCategory.id, personId: p[0].id, loanId: seededLoans[4].id, amount: Math.round(600  * m), type: 'DR', datetime: daysAgo(35), note: 'Full repayment to Sarah',      createdAt: daysAgo(35), updatedAt: daysAgo(35) },
  ];

  await db.insert(payments).values(loanPayments);

  const loanIncome  = loanPayments.filter(lp => lp.type === 'CR').reduce((s, lp) => s + lp.amount, 0);
  const loanExpense = loanPayments.filter(lp => lp.type === 'DR').reduce((s, lp) => s + lp.amount, 0);
  await db.update(accounts)
    .set({ balance: sql`${accounts.balance} + ${loanIncome} - ${loanExpense}`, income: sql`${accounts.income} + ${loanIncome}`, expense: sql`${accounts.expense} + ${loanExpense}`, updatedAt: now.toISOString() })
    .where(eq(accounts.id, usdAccount.id));

  return loanPayments.length;
}

// ─── Main seed function ───────────────────────────────────────────────────────

export async function seedDummyData() {
  try {
    const alreadySeeded = await AsyncStorage.getItem(StorageKeys.SEED_EXECUTED);
    if (alreadySeeded === 'true') {
      throw new Error('Seed data has already been generated. To re-seed, factory reset the app.');
    }

    const allCategories = await db.select().from(categories);
    const incomeCats  = allCategories.filter(c => c.type === 'CR');
    const expenseCats = allCategories.filter(c => c.type === 'DR');
    const transferCats = allCategories.filter(c => c.type === 'TR');

    if (incomeCats.length === 0 || expenseCats.length === 0) {
      throw new Error('Required categories missing. Ensure base categories are seeded.');
    }

    // Insert seed accounts (skip existing default if present)
    const existingAccounts = await db.select().from(accounts);
    const seededAccounts = await db.insert(accounts).values(
      SEED_ACCOUNTS.map((a, idx) => ({
        ...a,
        // If user already has a default, don't create a second one
        isDefault: idx === 0 && existingAccounts.length === 0 ? a.isDefault : false,
        icon: 'building',
        balance: 0,
        income: 0,
        expense: 0,
      }))
    ).returning();

    const allAccounts = [...existingAccounts, ...seededAccounts];

    const now = new Date();
    let totalSeeded = 0;

    for (const account of allAccounts) {
      const ctx: SeedContext = {
        accountId: account.id,
        multiplier: CURRENCY_MULTIPLIERS[account.currency.toUpperCase()] ?? 1,
        incomeCategories: incomeCats,
        expenseCategories: expenseCats,
        transferCategories: transferCats,
        now,
      };

      const txs = [];

      for (let m = 0; m < 12; m++) {
        const isCurrentMonth = m === 0;
        const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);

        txs.push(generateSalary(monthDate, ctx));
        txs.push(generateRent(monthDate, ctx));
        txs.push(...generateExpenses(monthDate, ctx, isCurrentMonth));

        const extraIncome = generateOccasionalIncome(monthDate, ctx);
        if (extraIncome) txs.push(extraIncome);
      }

      if (txs.length > 0) {
        await db.insert(payments).values(txs);

        const income  = txs.filter(t => t.type === 'CR').reduce((s, t) => s + t.amount, 0);
        const expense = txs.filter(t => t.type === 'DR').reduce((s, t) => s + t.amount, 0);

        await db.update(accounts)
          .set({
            balance:   sql`${accounts.balance} + ${income} - ${expense}`,
            income:    sql`${accounts.income} + ${income}`,
            expense:   sql`${accounts.expense} + ${expense}`,
            updatedAt: now.toISOString(),
          })
          .where(eq(accounts.id, account.id));

        totalSeeded += txs.length;
      }
    }

    // Cross-account transfers (same-currency pairs only)
    if (transferCats.length > 0) {
      const usdAccounts = allAccounts.filter(a => a.currency === 'USD');
      const inrAccounts = allAccounts.filter(a => a.currency === 'INR');
      const transferCat = transferCats[0];
      const transferTxs = [];

      const pairs = [
        ...usdAccounts.slice(0, -1).map((a, i) => [a, usdAccounts[i + 1]] as const),
        ...inrAccounts.slice(0, -1).map((a, i) => [a, inrAccounts[i + 1]] as const),
      ];

      for (const [source, dest] of pairs) {
        const multiplier = CURRENCY_MULTIPLIERS[source.currency.toUpperCase()] ?? 1;
        for (let m = 0; m < 6; m++) {
          const amount = Math.round(randInt(200, 600) * multiplier);
          const date = new Date(now.getFullYear(), now.getMonth() - m, randInt(10, 20));
          transferTxs.push({
            accountId: source.id,
            toAccountId: dest.id,
            categoryId: transferCat.id,
            amount,
            type: 'TR' as const,
            datetime: date.toISOString(),
            note: `Transfer to ${dest.name}`,
          });
        }
      }

      if (transferTxs.length > 0) {
        await db.insert(payments).values(transferTxs);
        totalSeeded += transferTxs.length;
      }
    }

    // Seed persons
    const insertedPersons = await db.insert(persons)
      .values(SEED_PERSONS.map(p => ({ ...p })))
      .returning();

    // Link ~⅓ of recent transactions to persons
    if (insertedPersons.length > 0) {
      const recentPayments = await db
        .select({ id: payments.id })
        .from(payments)
        .orderBy(sql`datetime DESC`)
        .limit(60);

      for (let i = 0; i < recentPayments.length; i++) {
        if (i % 3 === 0) {
          await db.update(payments)
            .set({ personId: insertedPersons[i % insertedPersons.length].id })
            .where(eq(payments.id, recentPayments[i].id));
        }
      }
    }

    // Seed demo loans
    const loanCount = await seedDemoLoans(insertedPersons, allAccounts, allCategories);
    totalSeeded += loanCount;

    await AsyncStorage.setItem(StorageKeys.SEED_EXECUTED, 'true');
    return totalSeeded;
  } catch (err) {
    console.error('[Seeder Error]:', err);
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to seed realistic data: ${msg}`);
  }
}
