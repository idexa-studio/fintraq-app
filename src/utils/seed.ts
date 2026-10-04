import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq, sql } from 'drizzle-orm';
import { format } from 'date-fns';
import { StorageKeys } from '@/src/constants/keys';
import { db } from '@/src/db/client';
import { accounts, categories, loans, payments, persons } from '@/src/db/schema';
import { LoggerService } from '@/src/services/logger.service';
import { resolveAccountTypeIcon } from '@/src/utils/icons';
import { toDbColor } from './format';

/**
 * Dev-only demo data (Developer → Seed dummy data): a year in the life of one person. The default
 * account becomes their everyday checking; savings, cash and a card are added in the same currency,
 * plus accounts in EUR, TRY and INR. Money comes in the way it really does (two paychecks, side
 * work, cashback, friends paying back) as well as going out. Notes always match their category, bills recur on fixed days,
 * and every balance is the sum of what was logged — so each screen tells the same story.
 */

// Deterministic PRNG so every run produces the same data.
let state = 20261004;
function rand() {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
}
const between = (min: number, max: number) => Math.round((min + rand() * (max - min)) * 100) / 100;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

type Acct = 'checking' | 'savings' | 'cash' | 'card' | 'eur' | 'try' | 'inr';
type Row = { acct: Acct; to?: Acct; cat: string; type: 'CR' | 'DR' | 'TR'; amount: number; date: Date; note: string; person?: string };

const VARIABLE: { cat: string; notes: string[]; min: number; max: number; perMonth: [number, number]; accts: Acct[]; person?: string }[] = [
  { cat: 'Groceries', notes: ['Weekly groceries', 'Farmers market', 'Grocery run', 'Pantry restock'], min: 38, max: 124, perMonth: [4, 5], accts: ['checking', 'card'] },
  { cat: 'Dining Out', notes: ['Sushi dinner', 'Team lunch', 'Pizza night', 'Brunch with friends', 'Taco stand'], min: 14, max: 68, perMonth: [3, 4], accts: ['card'] },
  { cat: 'Coffee', notes: ['Corner café', 'Morning latte', 'Coffee beans', 'Iced americano'], min: 4, max: 16, perMonth: [6, 8], accts: ['cash', 'card'] },
  { cat: 'Fuel', notes: ['Gas station', 'Fuel top-up'], min: 32, max: 58, perMonth: [2, 2], accts: ['card'] },
  { cat: 'Ride Share', notes: ['Ride to airport', 'Late night ride', 'Ride downtown'], min: 11, max: 34, perMonth: [1, 2], accts: ['card'] },
  { cat: 'Shopping', notes: ['New sneakers', 'Home decor', 'Desk lamp', 'Autumn jacket'], min: 25, max: 140, perMonth: [1, 2], accts: ['card'] },
  { cat: 'Entertainment', notes: ['Movie tickets', 'Concert tickets', 'Bowling night'], min: 18, max: 85, perMonth: [1, 2], accts: ['card', 'cash'] },
  { cat: 'Pharmacy', notes: ['Pharmacy', 'Vitamins'], min: 12, max: 46, perMonth: [0, 1], accts: ['checking'] },
  { cat: 'Books', notes: ['Bookstore', 'Paperback haul'], min: 12, max: 38, perMonth: [0, 1], accts: ['card'] },
  { cat: 'Pets', notes: ['Pet food', 'Vet checkup'], min: 22, max: 90, perMonth: [0, 1], accts: ['checking'] },
];

// Accounts held in other currencies: amounts are native to each (no conversion).
const FOREIGN: { acct: Acct; income: { cat: string; note: string; amount: number; day: number; every: number }[]; spend: { cat: string; notes: string[]; min: number; max: number; perMonth: [number, number] }[] }[] = [
  {
    acct: 'eur',
    income: [{ cat: 'Freelance', note: 'Client retainer — Berlin', amount: 1400, day: 10, every: 1 }],
    spend: [
      { cat: 'Dining Out', notes: ['Bistro dinner', 'Tapas night', 'Lunch in Lisbon'], min: 18, max: 62, perMonth: [2, 3] },
      { cat: 'Travel', notes: ['Train to Munich', 'Hotel — 2 nights', 'Museum pass'], min: 34, max: 210, perMonth: [1, 2] },
      { cat: 'Subscrip.', notes: ['Design tools plan'], min: 24, max: 24, perMonth: [1, 1] },
      { cat: 'Coffee', notes: ['Espresso bar', 'Bakery & coffee'], min: 3, max: 9, perMonth: [2, 4] },
    ],
  },
  {
    acct: 'try',
    income: [{ cat: 'Other Income', note: 'Apartment rental income', amount: 28000, day: 5, every: 1 }],
    spend: [
      { cat: 'Groceries', notes: ['Bazaar groceries', 'Market run'], min: 650, max: 2400, perMonth: [2, 3] },
      { cat: 'Dining Out', notes: ['Kebab dinner', 'Meze with family', 'Seaside breakfast'], min: 480, max: 1900, perMonth: [2, 3] },
      { cat: 'Maintenance', notes: ['Apartment upkeep', 'Building dues'], min: 1800, max: 4200, perMonth: [1, 1] },
      { cat: 'Ride Share', notes: ['Taxi to ferry', 'Airport transfer'], min: 220, max: 780, perMonth: [1, 2] },
    ],
  },
  {
    acct: 'inr',
    income: [
      { cat: 'Interests', note: 'Fixed deposit interest', amount: 4200, day: 7, every: 1 },
      { cat: 'Freelance', note: 'App design contract', amount: 45000, day: 16, every: 3 },
    ],
    spend: [
      { cat: 'Gifts given', notes: ['Family support'], min: 15000, max: 15000, perMonth: [1, 1] },
      { cat: 'Phone', notes: ['Mobile recharge'], min: 299, max: 299, perMonth: [1, 1] },
      { cat: 'Shopping', notes: ['Festival shopping', 'Kurta & gifts'], min: 1200, max: 6800, perMonth: [1, 2] },
      { cat: 'Dining Out', notes: ['Biryani dinner', 'Dosa breakfast', 'Chai & snacks'], min: 180, max: 1400, perMonth: [2, 4] },
    ],
  },
];

function at(year: number, month: number, day: number, hour = 9, minute = 0) {
  return new Date(year, month, day, hour, minute, 0);
}

export function buildRows(now: Date): Row[] {
  const rows: Row[] = [];
  const y = now.getFullYear();
  const mo = now.getMonth();

  for (let m = 0; m < 12; m++) {
    const first = new Date(y, mo - m, 1);
    const yy = first.getFullYear();
    const mm = first.getMonth();
    const lastDay = m === 0 ? now.getDate() : new Date(yy, mm + 1, 0).getDate();
    const ok = (day: number) => day <= lastDay;
    const day = () => 1 + Math.floor(rand() * lastDay);
    const time = (d: number) => {
      const date = at(yy, mm, d, 8 + Math.floor(rand() * 13), Math.floor(rand() * 60));
      // Never log into the future on the current day.
      return date > now ? at(yy, mm, d, 8, Math.floor(rand() * 60)) : date;
    };

    // ── Income: money arrives the way it does in a real month — two paychecks, side work most
    // months, and the small stuff (cashback, a friend paying back, something sold, interest).
    rows.push({ acct: 'checking', cat: 'Salary', type: 'CR', amount: 2600, date: at(yy, mm, 1, 9, 5), note: 'Paycheck' });
    if (ok(15)) rows.push({ acct: 'checking', cat: 'Salary', type: 'CR', amount: 2600, date: at(yy, mm, 15, 9, 5), note: 'Paycheck' });
    if (m % 4 !== 3) rows.push({ acct: 'checking', cat: 'Freelance', type: 'CR', amount: pick([450, 650, 850, 1200]), date: time(Math.min(18, lastDay)), note: pick(['Landing page project', 'Logo design', 'Consulting session', 'Website maintenance']) });
    if (ok(28)) rows.push({ acct: 'card', cat: 'Refunds', type: 'CR', amount: between(8, 24), date: at(yy, mm, 28, 6, 30), note: 'Card cashback' });
    if (m % 2 === 0) rows.push({ acct: 'checking', cat: 'Other Income', type: 'CR', amount: between(22, 58), date: time(day()), note: pick(['Sarah paid back brunch', 'Split bill settled']), person: 'Sarah Mitchell' });
    if (m % 3 === 1) rows.push({ acct: 'checking', cat: 'Other Income', type: 'CR', amount: between(40, 120), date: time(day()), note: pick(['Expense reimbursement', 'Travel reimbursement']), person: 'James Okafor' });
    if (m % 5 === 3) rows.push({ acct: 'cash', cat: 'Sales', type: 'CR', amount: pick([60, 120, 240]), date: time(day()), note: pick(['Sold old monitor', 'Sold bike rack', 'Sold textbooks']) });
    if (m % 3 === 2 && ok(22)) rows.push({ acct: 'savings', cat: 'Dividends', type: 'CR', amount: between(38, 64), date: at(yy, mm, 22, 10, 0), note: 'Quarterly dividend' });
    if (m > 0) rows.push({ acct: 'savings', cat: 'Interests', type: 'CR', amount: between(28, 36), date: at(yy, mm, lastDay, 7, 0), note: 'Savings interest' });

    // ── Fixed bills
    rows.push({ acct: 'checking', cat: 'Rent', type: 'DR', amount: 1850, date: at(yy, mm, 1, 10, 30), note: 'Monthly rent' });
    if (ok(3)) rows.push({ acct: 'card', cat: 'Gym', type: 'DR', amount: 39, date: at(yy, mm, 3, 7, 15), note: 'Gym membership' });
    if (ok(5)) rows.push({ acct: 'card', cat: 'Subscrip.', type: 'DR', amount: 15.49, date: at(yy, mm, 5, 6, 0), note: 'Streaming plan' });
    if (ok(8)) rows.push({ acct: 'checking', cat: 'Internet', type: 'DR', amount: 59.99, date: at(yy, mm, 8, 9, 0), note: 'Home internet' });
    if (ok(9)) rows.push({ acct: 'card', cat: 'Subscrip.', type: 'DR', amount: 10.99, date: at(yy, mm, 9, 6, 0), note: 'Music subscription' });
    if (ok(12)) rows.push({ acct: 'checking', cat: 'Electricity', type: 'DR', amount: between(72, 118), date: at(yy, mm, 12, 9, 0), note: 'Electricity bill' });
    if (ok(15)) rows.push({ acct: 'checking', cat: 'Phone', type: 'DR', amount: 45, date: at(yy, mm, 15, 9, 0), note: 'Phone plan' });
    if (ok(20)) rows.push({ acct: 'checking', cat: 'Insurance', type: 'DR', amount: 124, date: at(yy, mm, 20, 9, 0), note: 'Renters & auto insurance' });
    if (ok(2)) rows.push({ acct: 'checking', cat: 'Public Transit', type: 'DR', amount: 65, date: at(yy, mm, 2, 8, 10), note: 'Monthly train pass' });

    // ── Transfers
    if (ok(2)) rows.push({ acct: 'checking', to: 'savings', cat: 'Transfer', type: 'TR', amount: 1500, date: at(yy, mm, 2, 11, 0), note: 'Monthly savings' });
    if (ok(25)) rows.push({ acct: 'checking', to: 'card', cat: 'Transfer', type: 'TR', amount: between(780, 980), date: at(yy, mm, 25, 11, 0), note: 'Card payment' });
    if (ok(6)) rows.push({ acct: 'checking', to: 'cash', cat: 'Transfer', type: 'TR', amount: 80, date: at(yy, mm, 6, 17, 30), note: 'ATM withdrawal' });

    // ── Everyday spending (current month is only a few days old, so scale counts down)
    const scale = lastDay / 30;
    for (const v of VARIABLE) {
      const n = Math.round((v.perMonth[0] + Math.floor(rand() * (v.perMonth[1] - v.perMonth[0] + 1))) * (m === 0 ? Math.max(scale, 0.34) : 1));
      for (let i = 0; i < n; i++) {
        const note = pick(v.notes);
        rows.push({ acct: pick(v.accts), cat: v.cat, type: 'DR', amount: between(v.min, v.max), date: time(day()), note, person: note === 'Brunch with friends' ? 'Sarah Mitchell' : note === 'Team lunch' ? 'James Okafor' : undefined });
      }
    }

    // ── Accounts in other currencies
    for (const f of FOREIGN) {
      for (const inc of f.income) {
        if (m % inc.every === 0 && ok(inc.day)) rows.push({ acct: f.acct, cat: inc.cat, type: 'CR', amount: inc.amount, date: at(yy, mm, inc.day, 10, 15), note: inc.note });
      }
      for (const v of f.spend) {
        const n = Math.round((v.perMonth[0] + Math.floor(rand() * (v.perMonth[1] - v.perMonth[0] + 1))) * (m === 0 ? Math.max(scale, 0.34) : 1));
        for (let i = 0; i < n; i++) rows.push({ acct: f.acct, cat: v.cat, type: 'DR', amount: Math.round(between(v.min, v.max)), date: time(day()), note: pick(v.notes) });
      }
    }

    // ── One-offs that give the year some shape
    if (m === 2) rows.push({ acct: 'card', cat: 'Travel', type: 'DR', amount: 486.4, date: at(yy, mm, 14, 13, 20), note: 'Weekend trip — flights' });
    if (m === 2) rows.push({ acct: 'card', cat: 'Travel', type: 'DR', amount: 312, date: at(yy, mm, 16, 15, 0), note: 'Lake cabin stay' });
    if (m === 4) rows.push({ acct: 'card', cat: 'Electronics', type: 'DR', amount: 329, date: at(yy, mm, 11, 16, 40), note: 'Noise-cancelling headphones' });
    if (m === 6) rows.push({ acct: 'checking', cat: 'Refunds', type: 'CR', amount: 218.5, date: at(yy, mm, 19, 12, 0), note: 'Tax refund' });
    if (m === 9) rows.push({ acct: 'checking', cat: 'Gifts', type: 'CR', amount: 150, date: at(yy, mm, 24, 18, 0), note: 'Birthday gift' });
    if (m === 1) rows.push({ acct: 'card', cat: 'Gifts given', type: 'DR', amount: 64, date: at(yy, mm, 21, 14, 0), note: 'Anniversary flowers' });
  }

  // The last few days carry money in as well as out, so Home's recent list and "This month"
  // open on a believable mix rather than a column of expenses.
  const daysAgo = (d: number, hour: number, minute: number) => at(now.getFullYear(), now.getMonth(), now.getDate() - d, hour, minute);
  rows.push({ acct: 'checking', cat: 'Freelance', type: 'CR', amount: 780, date: daysAgo(1, 16, 40), note: 'Invoice paid — brand refresh' });
  rows.push({ acct: 'card', cat: 'Refunds', type: 'CR', amount: 34.99, date: daysAgo(2, 11, 15), note: 'Refund — returned headphones case' });
  rows.push({ acct: 'checking', to: 'savings', cat: 'Transfer', type: 'TR', amount: 250, date: daysAgo(3, 19, 5), note: 'Extra to savings' });

  // A coffee on every recent day without an entry keeps the logging streak unbroken.
  for (let d = 0; d < 26; d++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    const key = format(date, 'yyyy-MM-dd');
    if (!rows.some((r) => format(r.date, 'yyyy-MM-dd') === key)) {
      rows.push({ acct: 'cash', cat: 'Coffee', type: 'DR', amount: between(4, 9), date: at(date.getFullYear(), date.getMonth(), date.getDate(), 8, 20), note: 'Morning latte' });
    }
  }
  return rows.filter((r) => r.date <= now);
}

/** Where each added account ends up; its opening balance is back-solved from what was logged. */
const CLOSING_BALANCE: Record<Exclude<Acct, 'checking'>, number> = { savings: 26400, cash: 186.5, card: -412.18, eur: 3480.6, try: 42750, inr: 186400 };

const FOREIGN_ACCOUNTS = [
  { key: 'eur', currency: 'EUR', name: 'Euro Account', accountNumber: '••••  3306', accountType: 'bank', color: '#0E7490' },
  { key: 'try', currency: 'TRY', name: 'Lira Wallet', accountNumber: '', accountType: 'ewallet', color: '#DC2626' },
  { key: 'inr', currency: 'INR', name: 'Rupee Savings', accountNumber: '••••  5527', accountType: 'savings', color: '#EA580C' },
] as const;

export async function seedDummyData() {
  try {
    if ((await AsyncStorage.getItem(StorageKeys.SEED_EXECUTED)) === 'true') {
      throw new Error('Seed data has already been generated. To re-seed, factory reset the app.');
    }
    const now = new Date();
    state = 20261004;

    const existing = await db.select().from(accounts);
    const checking = existing.find((a) => a.isDefault) ?? existing[0];
    if (!checking) throw new Error('No account found. Finish onboarding first.');
    const home = checking.currency.toUpperCase();

    const cats = await db.select().from(categories);
    const catId = (name: string) => {
      const c = cats.find((x) => x.name === name);
      if (!c) throw new Error(`Required category "${name}" is missing. Ensure base categories are seeded.`);
      return c.id;
    };

    // ── Accounts: three more in the home currency, one in each other currency
    const base = { holderName: checking.holderName, isDefault: false, balance: 0, income: 0, expense: 0 };
    const foreign = FOREIGN_ACCOUNTS.filter((f) => f.currency !== home);
    const created = await db.insert(accounts).values([
      { ...base, currency: home, name: 'Savings', accountNumber: '••••  7203', accountType: 'savings' as const, icon: resolveAccountTypeIcon('savings'), color: toDbColor('#2563EB') },
      { ...base, currency: home, name: 'Cash', accountNumber: '', accountType: 'cash' as const, icon: resolveAccountTypeIcon('cash'), color: toDbColor('#D97706') },
      { ...base, currency: home, name: 'Credit Card', accountNumber: '••••  9914', accountType: 'credit_card' as const, icon: resolveAccountTypeIcon('credit_card'), color: toDbColor('#7C3AED') },
      ...foreign.map((f) => ({ ...base, currency: f.currency, name: f.name, accountNumber: f.accountNumber, accountType: f.accountType, icon: resolveAccountTypeIcon(f.accountType), color: toDbColor(f.color) })),
    ]).returning();
    const acctId: Partial<Record<Acct, number>> = { checking: checking.id, savings: created[0].id, cash: created[1].id, card: created[2].id };
    foreign.forEach((f, i) => { acctId[f.key] = created[3 + i].id; });

    // ── People
    const people = await db.insert(persons).values([
      { name: 'Sarah Mitchell', email: 'sarah.m@example.com', phone: '+1 555 0101', designation: 'Product Manager', company: 'Acme Corp', color: toDbColor('#059669') },
      { name: 'James Okafor', email: 'james.o@example.com', phone: '+1 555 0102', designation: 'Engineer', company: 'TechFlow', color: toDbColor('#2563EB') },
      { name: 'Priya Nair', email: 'priya.n@example.com', phone: '+1 555 0103', designation: 'Designer', company: 'Pixel Lab', color: toDbColor('#6D28D9') },
      { name: 'Tom Reyes', email: 'tom.r@example.com', phone: '+1 555 0104', designation: 'Landlord', company: '', color: toDbColor('#EA580C') },
    ]).returning();
    const personId = (name?: string) => people.find((p) => p.name === name)?.id ?? null;

    // ── Transactions
    const values = buildRows(now).flatMap((r) => {
      const accountId = acctId[r.acct];
      if (accountId === undefined) return [];
      const iso = r.date.toISOString();
      return [{
        accountId,
        toAccountId: r.to ? acctId[r.to] ?? null : null,
        categoryId: catId(r.cat),
        personId: r.cat === 'Rent' ? personId('Tom Reyes') : personId(r.person),
        loanId: null as number | null,
        amount: r.amount,
        type: r.type,
        datetime: iso,
        note: r.note,
        createdAt: iso,
        updatedAt: iso,
      }];
    });

    // ── Loans: lent, borrowed, overdue and repaid, plus one in each other currency that exists
    const loanCat = catId('Loan/EMI');
    const ago = (d: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - d, 14, 0).toISOString();
    const due = (d: number) => format(new Date(now.getFullYear(), now.getMonth(), now.getDate() + d), 'yyyy-MM-dd');
    type LoanSeed = { acct: Acct; person: number; type: 'lend' | 'borrow'; principal: number; status: 'active' | 'repaid'; dueIn?: number; note: string; opened: number; moves: [amount: number, type: 'CR' | 'DR', daysAgo: number, note: string][] };
    const loanSeeds: LoanSeed[] = [
      { acct: 'checking', person: 0, type: 'lend', principal: 500, status: 'active', dueIn: 28, note: 'Lent for travel expenses', opened: 15, moves: [[500, 'DR', 15, 'Loan given'], [150, 'CR', 6, 'Loan repayment received']] },
      { acct: 'checking', person: 1, type: 'borrow', principal: 1000, status: 'active', dueIn: 45, note: 'Borrowed for laptop repair', opened: 30, moves: [[1000, 'CR', 30, 'Loan received'], [400, 'DR', 10, 'Loan repayment sent']] },
      { acct: 'checking', person: 2, type: 'lend', principal: 300, status: 'active', dueIn: -5, note: 'Dinner split share', opened: 45, moves: [[300, 'DR', 45, 'Loan given']] },
      { acct: 'checking', person: 0, type: 'lend', principal: 200, status: 'repaid', note: 'Conference ticket split', opened: 75, moves: [[200, 'DR', 75, 'Loan given'], [200, 'CR', 40, 'Loan repayment received']] },
      { acct: 'eur', person: 2, type: 'lend', principal: 250, status: 'active', dueIn: 20, note: 'Shared hotel booking', opened: 12, moves: [[250, 'DR', 12, 'Loan given']] },
      { acct: 'inr', person: 1, type: 'borrow', principal: 20000, status: 'active', dueIn: 60, note: 'Advance for flight tickets', opened: 22, moves: [[20000, 'CR', 22, 'Loan received'], [5000, 'DR', 4, 'Loan repayment sent']] },
    ];
    for (const l of loanSeeds) {
      const accountId = acctId[l.acct];
      if (accountId === undefined) continue;
      const currency = l.acct === 'checking' ? checking.currency : l.acct.toUpperCase();
      const [loan] = await db.insert(loans).values({
        personId: people[l.person].id, type: l.type, principal: l.principal, currency, accountId, categoryId: loanCat,
        status: l.status, dueDate: l.dueIn === undefined ? null : due(l.dueIn), note: l.note, createdAt: ago(l.opened), updatedAt: ago(l.moves[l.moves.length - 1][2]),
      }).returning();
      for (const [amount, type, d, note] of l.moves) {
        values.push({ accountId, toAccountId: null, categoryId: loanCat, personId: people[l.person].id, loanId: loan.id, amount, type, datetime: ago(d), note, createdAt: ago(d), updatedAt: ago(d) });
      }
    }

    for (let i = 0; i < values.length; i += 100) await db.insert(payments).values(values.slice(i, i + 100));

    // ── Balances follow from the rows. The default account moves by its net; each new account
    // gets whatever opening balance lands it on its closing figure.
    const totals: Record<number, { income: number; expense: number }> = {};
    const bump = (id: number, k: 'income' | 'expense', v: number) => { (totals[id] ??= { income: 0, expense: 0 })[k] += v; };
    // What each account's balance moved by. Kept apart from the income / expense counters: a
    // transfer moves balance only (the ledger's rule), so it must not inflate either counter.
    const moved: Record<number, number> = {};
    const shift = (id: number, v: number) => { moved[id] = (moved[id] ?? 0) + v; };
    for (const v of values) {
      if (v.type === 'CR') { bump(v.accountId, 'income', v.amount); shift(v.accountId, v.amount); }
      else if (v.type === 'DR') { bump(v.accountId, 'expense', v.amount); shift(v.accountId, -v.amount); }
      else {
        shift(v.accountId, -v.amount);
        if (v.toAccountId) shift(v.toAccountId, v.amount);
      }
    }
    const cents = (n: number) => Math.round(n * 100) / 100;
    for (const key of Object.keys(acctId) as Acct[]) {
      const id = acctId[key];
      if (id === undefined) continue;
      const t = totals[id] ?? { income: 0, expense: 0 };
      await db.update(accounts).set({
        balance: key === 'checking' ? sql`${accounts.balance} + ${cents(moved[id] ?? 0)}` : CLOSING_BALANCE[key],
        income: sql`${accounts.income} + ${cents(t.income)}`,
        expense: sql`${accounts.expense} + ${cents(t.expense)}`,
        updatedAt: now.toISOString(),
      }).where(eq(accounts.id, id));
    }

    await AsyncStorage.setItem(StorageKeys.SEED_EXECUTED, 'true');
    return values.length;
  } catch (err) {
    LoggerService.error('SEED', 'Failed to seed demo data', err);
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to seed realistic data: ${msg}`);
  }
}
