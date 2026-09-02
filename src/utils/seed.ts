import { InferSelectModel, eq, sql } from 'drizzle-orm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../db/client';
import { accounts, categories, payments, persons, loans } from '../db/schema';
import { toDbColor } from './format';
import { StorageKeys } from '../constants/keys';

// ─── Seed accounts — 2 per target currency for transfer coverage ──────────────

type AccountTemplate = {
  name: string; holderName: string; accountNumber: string;
  accountType: 'bank' | 'savings' | 'credit_card' | 'investment' | 'ewallet' | 'cash';
  color: number; currency: string;
};

const SEED_ACCOUNTS: AccountTemplate[] = [
  // USD — 2 accounts to enable same-currency transfers
  { name: 'Chase Checking', holderName: 'Alex Morgan', accountNumber: '••••  4821', accountType: 'bank',    color: toDbColor('#2563EB'), currency: 'USD' },
  { name: 'Chase Savings',  holderName: 'Alex Morgan', accountNumber: '••••  7203', accountType: 'savings', color: toDbColor('#0EA5E9'), currency: 'USD' },
  // EUR — 2 accounts
  { name: 'Revolut',        holderName: 'Alex Morgan', accountNumber: 'REV-EU-0032', accountType: 'ewallet', color: toDbColor('#6D28D9'), currency: 'EUR' },
  { name: 'N26',            holderName: 'Alex Morgan', accountNumber: '••••  8841',  accountType: 'bank',    color: toDbColor('#0EA5E9'), currency: 'EUR' },
  // INR — 2 accounts
  { name: 'HDFC Bank',      holderName: 'Alex Morgan', accountNumber: '••••  9914', accountType: 'bank',    color: toDbColor('#EA580C'), currency: 'INR' },
  { name: 'Paytm Wallet',   holderName: 'Alex Morgan', accountNumber: '+91 98765 43210', accountType: 'ewallet', color: toDbColor('#0284C7'), currency: 'INR' },
];

const TARGET_CURRENCIES = ['USD', 'EUR', 'INR'] as const;

// ─── Seed persons ─────────────────────────────────────────────────────────────

const SEED_PERSONS = [
  { name: 'Sarah Mitchell', email: 'sarah.m@example.com', phone: '+1 555 0101', designation: 'Product Manager', company: 'Acme Corp', color: toDbColor('#059669') },
  { name: 'James Okafor',  email: 'james.o@example.com', phone: '+1 555 0102', designation: 'Engineer',        company: 'TechFlow',  color: toDbColor('#2563EB') },
  { name: 'Priya Nair',    email: 'priya.n@example.com', phone: '+1 555 0103', designation: 'Designer',        company: 'Pixel Lab', color: toDbColor('#6D28D9') },
  { name: 'Tom Reyes',     email: 'tom.r@example.com',   phone: '+1 555 0104', designation: 'CFO',             company: 'Reyes Co',  color: toDbColor('#EA580C') },
] as const;

// ─── Currency scaling ─────────────────────────────────────────────────────────

const CURRENCY_MULTIPLIERS: Record<string, number> = {
  USD: 1,    EUR: 0.92,  GBP: 0.79,  INR: 83,    JPY: 151,
  KRW: 1340, IDR: 15800, VND: 24700, AED: 3.67,  SAR: 3.75,
  CAD: 1.36, AUD: 1.52,  BRL: 5.0,   MXN: 16.7,  TRY: 32.2,
  SGD: 1.35, HKD: 7.82,  CHF: 0.90,  NOK: 10.6,  SEK: 10.4,
};

// ─── Note pools ───────────────────────────────────────────────────────────────

const INCOME_NOTES = [
  'Salary Credit — May', 'Freelance Invoice #2041', 'Client Payment — Acme Corp',
  'Dividend Payout', 'Consulting Fee', 'Bonus — Q2 Performance',
  'Interest Credit', 'Rental Income',
];

const EXPENSE_NOTES: Record<string, string[]> = {
  food:          ['Whole Foods Market', 'Chipotle', 'Trader Joe\'s', 'McDonald\'s', 'Starbucks', 'Local Bakery', 'Sushi Takeout', 'Pizza Delivery'],
  transport:     ['Uber Ride', 'Lyft', 'Gas Station — Shell', 'Subway Pass', 'Parking Fee', 'Flight Ticket', 'Taxi Fare'],
  shopping:      ['Amazon Purchase', 'Zara', 'IKEA', 'Target', 'Best Buy', 'Apple Store', 'H&M', 'Nike'],
  utilities:     ['Electricity Bill', 'Internet — AT&T', 'Water Bill', 'Phone Bill', 'Gas Bill'],
  health:        ['CVS Pharmacy', 'Gym Membership', 'Doctor Visit Copay', 'Dental Checkup', 'Vitamins & Supplements'],
  entertainment: ['Netflix Subscription', 'Spotify Premium', 'Movie Tickets', 'Steam Purchase', 'Concert Tickets'],
  housing:       ['Monthly Rent', 'Airbnb Stay', 'Home Insurance', 'Maintenance & Repairs'],
  other:         ['ATM Withdrawal', 'Bank Fee', 'Miscellaneous', 'Gift for Friend', 'Online Course', 'Donation'],
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
  const amount = Math.round(randInt(3500, 7000) * ctx.multiplier);
  const date = new Date(monthDate);
  date.setDate(randInt(1, 5));
  return { accountId: ctx.accountId, categoryId: randFrom(ctx.incomeCategories).id, amount, type: 'CR' as const, datetime: date.toISOString(), note: randFrom(INCOME_NOTES) };
}

function generateRent(monthDate: Date, ctx: SeedContext) {
  const amount = Math.round(randInt(900, 2200) * ctx.multiplier);
  const date = new Date(monthDate);
  date.setDate(1);
  const rentCat = ctx.expenseCategories.find(c => {
    const n = c.name.toLowerCase();
    return n.includes('rent') || n.includes('hous') || n.includes('home');
  }) ?? ctx.expenseCategories[0];
  return { accountId: ctx.accountId, categoryId: rentCat.id, amount, type: 'DR' as const, datetime: date.toISOString(), note: 'Monthly Rent Payment' };
}

function generateExpenses(monthDate: Date, ctx: SeedContext, isCurrentMonth: boolean) {
  const maxDay = isCurrentMonth ? ctx.now.getDate() : 28;
  return Array.from({ length: randInt(8, 18) }, () => {
    const date = new Date(monthDate);
    date.setDate(randInt(1, maxDay));
    return { accountId: ctx.accountId, categoryId: randFrom(ctx.expenseCategories).id, amount: Math.round(randInt(4, 220) * ctx.multiplier), type: 'DR' as const, datetime: date.toISOString(), note: randFrom(ALL_EXPENSE_NOTES) };
  });
}

function generateOccasionalIncome(monthDate: Date, ctx: SeedContext) {
  if (Math.random() > 0.35) return null;
  const date = new Date(monthDate);
  date.setDate(randInt(8, 25));
  return { accountId: ctx.accountId, categoryId: randFrom(ctx.incomeCategories).id, amount: Math.round(randInt(200, 1500) * ctx.multiplier), type: 'CR' as const, datetime: date.toISOString(), note: randFrom(['Freelance Invoice #' + randInt(1000, 9999), 'Dividend Payout', 'Referral Bonus', 'Side Project Income']) };
}

// ─── Main seed function ───────────────────────────────────────────────────────

export async function seedDummyData() {
  try {
    const alreadySeeded = await AsyncStorage.getItem(StorageKeys.SEED_EXECUTED);
    if (alreadySeeded === 'true') {
      throw new Error('Seed data has already been generated. To re-seed, factory reset the app.');
    }

    const allCategories = await db.select().from(categories);
    const incomeCats   = allCategories.filter(c => c.type.split(',').includes('CR'));
    const expenseCats  = allCategories.filter(c => c.type.split(',').includes('DR'));
    const transferCats = allCategories.filter(c => c.type.split(',').includes('TR'));

    if (incomeCats.length === 0 || expenseCats.length === 0) {
      throw new Error('Required categories missing. Ensure base categories are seeded.');
    }

    // ── Accounts ──────────────────────────────────────────────────────────────
    // Seed target-currency accounts that aren't already present.
    // We count existing accounts per currency so we don't over-seed.

    const existingAccounts = await db.select().from(accounts);
    const existingCountByCurrency: Record<string, number> = {};
    for (const a of existingAccounts) {
      const cur = a.currency.toUpperCase();
      existingCountByCurrency[cur] = (existingCountByCurrency[cur] ?? 0) + 1;
    }

    const userDefaultCurrency = (
      existingAccounts.find(a => a.isDefault)?.currency ??
      existingAccounts[0]?.currency ??
      'USD'
    ).toUpperCase();

    // For each target currency, seed enough accounts to reach 2 total
    const accountsToInsert: (typeof SEED_ACCOUNTS[number] & { isDefault: boolean; icon: string; balance: number; income: number; expense: number })[] = [];
    const templatesByCurrency: Record<string, AccountTemplate[]> = {};
    for (const tmpl of SEED_ACCOUNTS) {
      (templatesByCurrency[tmpl.currency] ??= []).push(tmpl);
    }

    for (const cur of TARGET_CURRENCIES) {
      const existing = existingCountByCurrency[cur] ?? 0;
      const templates = templatesByCurrency[cur] ?? [];
      const needed = Math.max(0, 2 - existing); // need at least 2 total for transfers
      for (let i = 0; i < Math.min(needed, templates.length); i++) {
        accountsToInsert.push({ ...templates[i], isDefault: false, icon: 'building', balance: 0, income: 0, expense: 0 });
      }
    }

    // If user's default currency isn't one of the targets, also seed 2 accounts for it
    if (!TARGET_CURRENCIES.includes(userDefaultCurrency as any)) {
      const existing = existingCountByCurrency[userDefaultCurrency] ?? 0;
      if (existing < 2) {
        // Seed a generic second account for their currency
        accountsToInsert.push({
          name: 'Savings Account', holderName: 'Alex Morgan', accountNumber: '••••  0001',
          accountType: 'savings', color: toDbColor('#0EA5E9'), currency: userDefaultCurrency,
          isDefault: false, icon: 'building', balance: 0, income: 0, expense: 0,
        });
      }
    }

    const seededAccounts = accountsToInsert.length > 0
      ? await db.insert(accounts).values(accountsToInsert).returning()
      : [];

    const allAccounts = [...existingAccounts, ...seededAccounts];

    // ── Transactions — 12 months per account ─────────────────────────────────

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

      const txs: any[] = [];
      for (let m = 0; m < 12; m++) {
        const isCurrentMonth = m === 0;
        const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
        txs.push(generateSalary(monthDate, ctx));
        txs.push(generateRent(monthDate, ctx));
        txs.push(...generateExpenses(monthDate, ctx, isCurrentMonth));
        const extra = generateOccasionalIncome(monthDate, ctx);
        if (extra) txs.push(extra);
      }

      if (txs.length > 0) {
        await db.insert(payments).values(txs);
        const income  = txs.filter(t => t.type === 'CR').reduce((s, t) => s + t.amount, 0);
        const expense = txs.filter(t => t.type === 'DR').reduce((s, t) => s + t.amount, 0);
        await db.update(accounts)
          .set({ balance: sql`${accounts.balance} + ${income} - ${expense}`, income: sql`${accounts.income} + ${income}`, expense: sql`${accounts.expense} + ${expense}`, updatedAt: now.toISOString() })
          .where(eq(accounts.id, account.id));
        totalSeeded += txs.length;
      }
    }

    // ── Same-currency transfers (consecutive pairs per currency, 6 months) ────

    if (transferCats.length > 0) {
      const transferCat = transferCats[0];
      const transferTxs: any[] = [];

      // Group by currency, build consecutive pairs [0→1, 1→2, ...]
      const byCurrency: Record<string, typeof allAccounts> = {};
      for (const a of allAccounts) {
        (byCurrency[a.currency.toUpperCase()] ??= []).push(a);
      }

      for (const group of Object.values(byCurrency)) {
        if (group.length < 2) continue;
        const multiplier = CURRENCY_MULTIPLIERS[group[0].currency.toUpperCase()] ?? 1;
        // Consecutive pairs: [0→1], [1→2], etc. (matches original pattern)
        for (let i = 0; i < group.length - 1; i++) {
          const source = group[i];
          const dest   = group[i + 1];
          for (let m = 0; m < 6; m++) {
            const amount = Math.round(randInt(200, 600) * multiplier);
            const date = new Date(now.getFullYear(), now.getMonth() - m, randInt(10, 20));
            transferTxs.push({ accountId: source.id, toAccountId: dest.id, categoryId: transferCat.id, amount, type: 'TR' as const, datetime: date.toISOString(), note: `Transfer to ${dest.name}` });
          }
        }
      }

      if (transferTxs.length > 0) {
        await db.insert(payments).values(transferTxs);

        // Update balances for both sides of each transfer
        const deltaByAccount: Record<number, { income: number; expense: number }> = {};
        for (const tx of transferTxs) {
          (deltaByAccount[tx.accountId]     ??= { income: 0, expense: 0 }).expense += tx.amount;
          (deltaByAccount[tx.toAccountId]   ??= { income: 0, expense: 0 }).income  += tx.amount;
        }
        for (const [idStr, delta] of Object.entries(deltaByAccount)) {
          const id = Number(idStr);
          await db.update(accounts)
            .set({ balance: sql`${accounts.balance} + ${delta.income} - ${delta.expense}`, income: sql`${accounts.income} + ${delta.income}`, expense: sql`${accounts.expense} + ${delta.expense}`, updatedAt: now.toISOString() })
            .where(eq(accounts.id, id));
        }

        totalSeeded += transferTxs.length;
      }
    }

    // ── Persons ───────────────────────────────────────────────────────────────

    const insertedPersons = await db.insert(persons)
      .values(SEED_PERSONS.map(p => ({ ...p })))
      .returning();

    if (insertedPersons.length > 0) {
      const recentPayments = await db.select({ id: payments.id }).from(payments).orderBy(sql`datetime DESC`).limit(60);
      for (let i = 0; i < recentPayments.length; i++) {
        if (i % 3 === 0) {
          await db.update(payments).set({ personId: insertedPersons[i % insertedPersons.length].id }).where(eq(payments.id, recentPayments[i].id));
        }
      }
    }

    // ── Loans — seeded in each target currency + user default currency ────────

    if (insertedPersons.length >= 3) {
      const loanCategory =
        allCategories.find(c => c.name.toLowerCase() === 'loan/emi') ??
        allCategories.find(c => c.name.toLowerCase() === 'uncategorized') ??
        allCategories[0];

      const daysAgo     = (d: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - d).toISOString();
      const daysFromNow = (d: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + d).toISOString().slice(0, 10);
      const daysAgoDate = (d: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - d).toISOString().slice(0, 10);

      const p = insertedPersons;

      const loanCurrencies = Array.from(new Set([...TARGET_CURRENCIES, userDefaultCurrency]));

      for (const cur of loanCurrencies) {
        const acct = allAccounts.find(a => a.currency.toUpperCase() === cur);
        if (!acct) continue;

        const m = CURRENCY_MULTIPLIERS[cur] ?? 1;

        const seededLoans = await db.insert(loans).values([
          // active lend — partial repayment
          { personId: p[0].id, type: 'lend'   as const, principal: Math.round(500  * m), currency: acct.currency, accountId: acct.id, categoryId: loanCategory.id, status: 'active' as const, dueDate: daysFromNow(28),  note: 'Lent for travel expenses',   createdAt: daysAgo(15), updatedAt: daysAgo(15) },
          // active borrow — partial repayment
          { personId: p[1].id, type: 'borrow' as const, principal: Math.round(1000 * m), currency: acct.currency, accountId: acct.id, categoryId: loanCategory.id, status: 'active' as const, dueDate: daysFromNow(45),  note: 'Borrowed for laptop repair', createdAt: daysAgo(30), updatedAt: daysAgo(10) },
          // overdue lend — no repayment
          { personId: p[2].id, type: 'lend'   as const, principal: Math.round(300  * m), currency: acct.currency, accountId: acct.id, categoryId: loanCategory.id, status: 'active' as const, dueDate: daysAgoDate(5),   note: 'Dinner split share',         createdAt: daysAgo(45), updatedAt: daysAgo(45) },
          // fully repaid lend
          { personId: p[0].id, type: 'lend'   as const, principal: Math.round(200  * m), currency: acct.currency, accountId: acct.id, categoryId: loanCategory.id, status: 'repaid' as const,                            note: 'Conference ticket split',    createdAt: daysAgo(75), updatedAt: daysAgo(40) },
        ]).returning();

        type PayRow = { accountId: number; categoryId: number; personId: number | null; loanId: number; amount: number; type: 'CR' | 'DR'; datetime: string; note: string; createdAt: string; updatedAt: string };
        const loanPayments: PayRow[] = [
          // Loan 0: lend 500, no repayment yet
          { accountId: acct.id, categoryId: loanCategory.id, personId: p[0].id, loanId: seededLoans[0].id, amount: Math.round(500 * m),  type: 'DR', datetime: daysAgo(15), note: 'Loan given',              createdAt: daysAgo(15), updatedAt: daysAgo(15) },
          // Loan 1: borrow 1000, repaid 200
          { accountId: acct.id, categoryId: loanCategory.id, personId: p[1].id, loanId: seededLoans[1].id, amount: Math.round(1000 * m), type: 'CR', datetime: daysAgo(30), note: 'Loan received',            createdAt: daysAgo(30), updatedAt: daysAgo(30) },
          { accountId: acct.id, categoryId: loanCategory.id, personId: p[1].id, loanId: seededLoans[1].id, amount: Math.round(200 * m),  type: 'DR', datetime: daysAgo(10), note: 'Loan repayment sent',      createdAt: daysAgo(10), updatedAt: daysAgo(10) },
          // Loan 2: lend 300, overdue, no repayment
          { accountId: acct.id, categoryId: loanCategory.id, personId: p[2].id, loanId: seededLoans[2].id, amount: Math.round(300 * m),  type: 'DR', datetime: daysAgo(45), note: 'Loan given',              createdAt: daysAgo(45), updatedAt: daysAgo(45) },
          // Loan 3: lend 200, fully repaid
          { accountId: acct.id, categoryId: loanCategory.id, personId: p[0].id, loanId: seededLoans[3].id, amount: Math.round(200 * m),  type: 'DR', datetime: daysAgo(75), note: 'Loan given',              createdAt: daysAgo(75), updatedAt: daysAgo(75) },
          { accountId: acct.id, categoryId: loanCategory.id, personId: p[0].id, loanId: seededLoans[3].id, amount: Math.round(200 * m),  type: 'CR', datetime: daysAgo(40), note: 'Loan repayment received', createdAt: daysAgo(40), updatedAt: daysAgo(40) },
        ];

        await db.insert(payments).values(loanPayments);

        const loanIncome  = loanPayments.filter(lp => lp.type === 'CR').reduce((s, lp) => s + lp.amount, 0);
        const loanExpense = loanPayments.filter(lp => lp.type === 'DR').reduce((s, lp) => s + lp.amount, 0);
        await db.update(accounts)
          .set({ balance: sql`${accounts.balance} + ${loanIncome} - ${loanExpense}`, income: sql`${accounts.income} + ${loanIncome}`, expense: sql`${accounts.expense} + ${loanExpense}`, updatedAt: now.toISOString() })
          .where(eq(accounts.id, acct.id));

        totalSeeded += loanPayments.length;
      }
    }

    await AsyncStorage.setItem(StorageKeys.SEED_EXECUTED, 'true');
    return totalSeeded;
  } catch (err) {
    console.error('[Seeder Error]:', err);
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to seed realistic data: ${msg}`);
  }
}
