import { InferSelectModel, eq, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { accounts, categories, payments } from '../db/schema';

type Category = InferSelectModel<typeof categories>;

/**
 * Currency-based scaling factors for realistic amount generation.
 */
const CURRENCY_MULTIPLIERS: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, INR: 83, JPY: 151, KRW: 1340,
  IDR: 15800, VND: 24700, AED: 3.67, SAR: 3.75, CAD: 1.36,
  AUD: 1.52, BRL: 5.0, MXN: 16.7, TRY: 32.2,
};

type SeedContext = {
  accountId: number;
  multiplier: number;
  incomeCategories: Category[];
  expenseCategories: Category[];
  now: Date;
};

/**
 * Generates a monthly salary transaction.
 */
function generateSalary(monthDate: Date, ctx: SeedContext) {
  const baseAmount = 4000 + Math.floor(Math.random() * 3000);
  const amount = (baseAmount + Math.floor(Math.random() * 1000)) * ctx.multiplier;
  const date = new Date(monthDate);
  date.setDate(1 + Math.floor(Math.random() * 5)); // 1st - 5th

  return {
    accountId: ctx.accountId,
    categoryId: ctx.incomeCategories[Math.floor(Math.random() * ctx.incomeCategories.length)].id,
    amount,
    type: 'CR' as const,
    datetime: date.toISOString(),
    note: 'Monthly Salary Credit',
  };
}

/**
 * Generates a recurring monthly rent payment.
 */
function generateRent(monthDate: Date, ctx: SeedContext) {
  const baseAmount = 1000 + Math.floor(Math.random() * 800);
  const amount = baseAmount * ctx.multiplier;
  const date = new Date(monthDate);
  date.setDate(1); // Usually 1st

  const rentCat = ctx.expenseCategories.find(c => {
    const name = c.name.toLowerCase();
    return name.includes('rent') || name.includes('housing');
  }) || ctx.expenseCategories[0];
  
  return {
    accountId: ctx.accountId,
    categoryId: rentCat.id,
    amount,
    type: 'DR' as const,
    datetime: date.toISOString(),
    note: 'Monthly Rent Payment',
  };
}

/**
 * Generates a set of random daily expenses for a given month.
 */
function generateRandomExpenses(monthDate: Date, ctx: SeedContext, isCurrentMonth: boolean) {
  const transactions = [];
  const count = 5 + Math.floor(Math.random() * 10);
  const maxDay = isCurrentMonth ? ctx.now.getDate() : 28;

  const notes = [
    'Grocery Shopping', 'Coffee with friend', 'Amazon Purchase', 
    'Uber Ride', 'Netflix Subscription', 'Gym Membership', 
    'Dining Out', 'Pharmacy', 'Utility bill', 'Gas Station'
  ];

  for (let i = 0; i < count; i++) {
    const baseAmount = 5 + Math.floor(Math.random() * 150);
    const amount = baseAmount * ctx.multiplier;
    const date = new Date(monthDate);
    date.setDate(1 + Math.floor(Math.random() * maxDay));

    const category = ctx.expenseCategories[Math.floor(Math.random() * ctx.expenseCategories.length)];
    const note = notes[Math.floor(Math.random() * notes.length)];

    transactions.push({
      accountId: ctx.accountId,
      categoryId: category.id,
      amount,
      type: 'DR' as const,
      datetime: date.toISOString(),
      note: `${note} (${category.name})`,
    });
  }
  return transactions;
}

/**
 * Robust utility to professionally seed the database with realistic multi-account data.
 */
export async function seedDummyData() {
  try {
    const allAccounts = await db.select().from(accounts);
    if (allAccounts.length === 0) {
      throw new Error('No accounts found. Please complete onboarding first.');
    }

    const allCategories = await db.select().from(categories);
    const incomeCats = allCategories.filter(c => c.type === 'CR');
    const expenseCats = allCategories.filter(c => c.type === 'DR');

    if (incomeCats.length === 0 || expenseCats.length === 0) {
      throw new Error('Required categories missing. Ensure base categories are seeded.');
    }

    const now = new Date();
    let totalSeeded = 0;

    for (const account of allAccounts) {
      const ctx: SeedContext = {
        accountId: account.id,
        multiplier: CURRENCY_MULTIPLIERS[account.currency.toUpperCase()] ?? 1,
        incomeCategories: incomeCats,
        expenseCategories: expenseCats,
        now,
      };

      const accountTransactions = [];

      // Generate 12 months of history
      for (let m = 0; m < 12; m++) {
        const isCurrentMonth = m === 0;
        const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);

        // 1. Income
        accountTransactions.push(generateSalary(monthDate, ctx));

        // 2. Fixed Cost
        accountTransactions.push(generateRent(monthDate, ctx));

        // 3. Variable Spending
        accountTransactions.push(...generateRandomExpenses(monthDate, ctx, isCurrentMonth));
      }

      // Batch insert transactions for this account
      if (accountTransactions.length > 0) {
        await db.insert(payments).values(accountTransactions);

        const income = accountTransactions.filter(t => t.type === 'CR').reduce((sum, t) => sum + t.amount, 0);
        const expense = accountTransactions.filter(t => t.type === 'DR').reduce((sum, t) => sum + t.amount, 0);

        // Update account state
        await db.update(accounts)
          .set({
            balance: sql`${accounts.balance} + ${income} - ${expense}`,
            income: sql`${accounts.income} + ${income}`,
            expense: sql`${accounts.expense} + ${expense}`,
            updatedAt: now.toISOString(),
          })
          .where(eq(accounts.id, account.id));

        totalSeeded += accountTransactions.length;
      }
    }

    return totalSeeded;
  } catch (err) {
    console.error('[Seeder Error]:', err);
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to seed realistic data: ${msg}`);
  }
}
