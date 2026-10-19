import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq, sql } from 'drizzle-orm';
import { format } from 'date-fns';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import { db } from '@/data/db/client';
import { accounts, budgets, categories, loans, payments, persons } from '@/data/db/schema';
import { LoggerService } from '@/shared/logging/logger';
import { PALETTE_COLOR_OPTIONS } from '@/shared/contracts/pickers';
import { toDbColor } from '@/shared/format/color';

/**
 * Dev-only demo data (Developer → Seed dummy data): a year in the life of one person. The default
 * account becomes their everyday checking; savings, cash and a card are added in the same currency,
 * plus accounts in three others (EUR, TRY and INR; USD in place of the home one). The home currency
 * picks a life to match (`HOME_PROFILES`): a rupee home is a month in India — chai, petrol, an EMI,
 * a UPI wallet, money lent to friends — not dollar figures relabelled. Money comes in the way it
 * really does (paychecks, side work, cashback, friends paying back) as well as going out. Notes always
 * match their category, bills recur on fixed days, and every balance is the sum of what was logged —
 * so each screen tells the same story. Budgets are set against what the month has actually spent, so
 * the Plan tab opens on one in each state.
 */

/** A colour from the app's own palette, by name, so demo data uses only colours a user could have picked. */
const shade = (name: string): string => PALETTE_COLOR_OPTIONS.find((color) => color.name === name)?.hex ?? PALETTE_COLOR_OPTIONS[0]!.hex;

// Accounts are drawn by their kind; the column keeps the value every version has written.
const ACCOUNT_ICON = 'building';

// Deterministic PRNG so every run produces the same data.
let state = 20261004;
function rand() {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
}
const between = (min: number, max: number) => Math.round((min + rand() * (max - min)) * 100) / 100;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

type Acct = 'checking' | 'savings' | 'cash' | 'card' | 'wallet' | 'usd' | 'eur' | 'try' | 'inr';
type Foreign = 'usd' | 'eur' | 'try' | 'inr';
/** One of the profile's four people: two friends, a colleague-friend, and the landlord. */
type Who = 0 | 1 | 2 | 3;
type Row = { acct: Acct; to?: Acct; cat: string; type: 'CR' | 'DR' | 'TR'; amount: number; date: Date; note: string; person?: Who };
type Spend = { cat: string; notes: string[]; min: number; max: number; perMonth: [number, number]; accts: Acct[] };
type Person = { name: string; email: string; phone: string; designation: string; company: string; color: string };

/** Bills priced where the person lives, and the closing balances of the accounts added in the home currency. */
type Fixed = 'salary' | 'rent' | 'gym' | 'streaming' | 'internet' | 'music' | 'phone' | 'insurance' | 'transit' | 'savings' | 'cash' | 'card';

/**
 * The life the demo data tells, chosen by the home currency. Figures written in dollars elsewhere in
 * this file are turned into the home currency by `scale` (`whole` drops the cents); `fixed` prices the
 * bills that do not follow the scale, and `variable` and `daily` are already in the home currency.
 * A currency without a profile gets the dollar life, as written.
 */
type HomeProfile = {
  scale: number;
  whole: boolean;
  paychecks: 1 | 2;
  budgetStep: number;
  variable: Spend[];
  /** The small spend on every recent day without an entry, which keeps the logging streak unbroken. */
  daily: { cat: string; note: string; min: number; max: number; acct: Acct };
  fixed: Partial<Record<Fixed, number>>;
  /** Notes said differently here; a note not listed is kept. */
  notes: Partial<Record<string, string>>;
  /** Spending shared with someone, by its note. */
  shared: Partial<Record<string, Who>>;
  people: readonly [Person, Person, Person, Person];
  /** The four loans in the home currency, each move's amount in order (lent, borrowed, overdue, repaid). */
  loans?: number[][];
  /** A wallet paid from by phone, topped up from the main account on the 1st and the 16th. */
  wallet?: { name: string; topUp: number; closing: number };
  /** An instalment taken on the 5th. */
  emi?: { note: string; amount: number };
};

const DOLLAR_LIFE: HomeProfile = {
  scale: 1,
  whole: false,
  paychecks: 2,
  budgetStep: 5,
  variable: [
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
  ],
  daily: { cat: 'Coffee', note: 'Morning latte', min: 4, max: 9, acct: 'cash' },
  fixed: {},
  notes: {},
  shared: { 'Brunch with friends': 0, 'Team lunch': 1 },
  people: [
    { name: 'Sarah Mitchell', email: 'sarah.m@example.com', phone: '+1 555 0101', designation: 'Product Manager', company: 'Acme Corp', color: shade('emerald') },
    { name: 'James Okafor', email: 'james.o@example.com', phone: '+1 555 0102', designation: 'Engineer', company: 'TechFlow', color: shade('blue') },
    { name: 'Priya Nair', email: 'priya.n@example.com', phone: '+1 555 0103', designation: 'Designer', company: 'Pixel Lab', color: shade('violet') },
    { name: 'Tom Reyes', email: 'tom.r@example.com', phone: '+1 555 0104', designation: 'Landlord', company: '', color: shade('orange') },
  ],
};

const HOME_PROFILES: Record<string, HomeProfile> = {
  INR: {
    scale: 40,
    whole: true,
    paychecks: 1,
    budgetStep: 100,
    variable: [
      { cat: 'Groceries', notes: ['Sabzi market', 'Kirana store', 'Monthly ration', 'Fruits & milk'], min: 280, max: 2600, perMonth: [5, 7], accts: ['wallet', 'card'] },
      { cat: 'Delivery', notes: ['Food delivery', 'Late night food order', 'Lunch delivery'], min: 220, max: 780, perMonth: [3, 5], accts: ['wallet', 'card'] },
      { cat: 'Dining Out', notes: ['Biryani dinner', 'Dosa breakfast', 'Team lunch', 'Dinner with friends'], min: 250, max: 1800, perMonth: [2, 4], accts: ['wallet', 'card'] },
      { cat: 'Coffee', notes: ['Chai', 'Chai & samosa', 'Filter coffee', 'Café coffee'], min: 20, max: 240, perMonth: [8, 12], accts: ['wallet', 'cash'] },
      { cat: 'Fuel', notes: ['Petrol', 'Petrol top-up'], min: 600, max: 1800, perMonth: [2, 3], accts: ['card', 'wallet'] },
      { cat: 'Ride Share', notes: ['Auto to office', 'Cab home', 'Cab to airport'], min: 60, max: 650, perMonth: [3, 5], accts: ['wallet'] },
      { cat: 'Shopping', notes: ['Online order', 'New kurta', 'Phone cover', 'Festival shopping'], min: 400, max: 4500, perMonth: [1, 2], accts: ['card', 'wallet'] },
      { cat: 'Entertainment', notes: ['Movie tickets', 'Cricket match tickets', 'Concert tickets'], min: 300, max: 2500, perMonth: [1, 2], accts: ['card', 'wallet'] },
      { cat: 'Pharmacy', notes: ['Medicines', 'Vitamins'], min: 120, max: 900, perMonth: [0, 1], accts: ['wallet'] },
      { cat: 'Books', notes: ['Bookstore', 'Exam books'], min: 200, max: 900, perMonth: [0, 1], accts: ['wallet'] },
    ],
    daily: { cat: 'Coffee', note: 'Chai', min: 20, max: 60, acct: 'cash' },
    fixed: { salary: 140000, rent: 32000, gym: 1500, streaming: 649, internet: 999, music: 119, phone: 399, insurance: 3500, transit: 1200, savings: 685000, cash: 4350, card: -18640 },
    notes: {
      Paycheck: 'Salary',
      'Sarah paid back brunch': 'Rahul paid back dinner',
      'Home internet': 'Home broadband',
      'Phone plan': 'Mobile recharge',
      'Renters & auto insurance': 'Health insurance',
      'Monthly train pass': 'Metro card recharge',
      'Card payment': 'Credit card bill',
      'Sold bike rack': 'Sold old cycle',
      'Weekend trip — flights': 'Goa trip — flights',
      'Lake cabin stay': 'Homestay in Coorg',
      'Tax refund': 'Income tax refund',
    },
    shared: { 'Dinner with friends': 0, 'Team lunch': 1 },
    people: [
      { name: 'Rahul Sharma', email: 'rahul.s@example.com', phone: '+91 98200 10101', designation: 'Product Manager', company: 'Acme Corp', color: shade('emerald') },
      { name: 'Priya Verma', email: 'priya.v@example.com', phone: '+91 98200 10102', designation: 'Engineer', company: 'TechFlow', color: shade('violet') },
      { name: 'Arjun Mehta', email: 'arjun.m@example.com', phone: '+91 98200 10103', designation: 'Designer', company: 'Pixel Lab', color: shade('blue') },
      { name: 'Ramesh Iyer', email: 'ramesh.i@example.com', phone: '+91 98200 10104', designation: 'Landlord', company: '', color: shade('orange') },
    ],
    // Rahul owes ₹1,500 of ₹2,500; you owe Priya ₹600 of ₹2,000; Arjun's ₹800 is overdue; ₹1,200 came back.
    loans: [[2500, 1000], [2000, 1400], [800], [1200, 1200]],
    wallet: { name: 'UPI Wallet', topUp: 8000, closing: 2340 },
    emi: { note: 'Bike EMI', amount: 4200 },
  },
};
const profileFor = (home: string): HomeProfile => HOME_PROFILES[home.toUpperCase()] ?? DOLLAR_LIFE;

/** The other currencies' accounts, in the order they are made: the first three that are not the home one. */
const FOREIGN_ORDER: readonly Foreign[] = ['usd', 'eur', 'try', 'inr'];
const foreignFor = (home: string): Foreign[] => FOREIGN_ORDER.filter((key) => key.toUpperCase() !== home.toUpperCase()).slice(0, 3);

// Accounts held in other currencies: amounts are native to each (no conversion).
const FOREIGN: { acct: Foreign; income: { cat: string; note: string; amount: number; day: number; every: number }[]; spend: Omit<Spend, 'accts'>[] }[] = [
  {
    acct: 'usd',
    income: [{ cat: 'Freelance', note: 'Client retainer — New York', amount: 1200, day: 12, every: 1 }],
    spend: [
      { cat: 'Subscrip.', notes: ['Cloud hosting'], min: 20, max: 20, perMonth: [1, 1] },
      { cat: 'Shopping', notes: ['Online order', 'Course purchase'], min: 12, max: 90, perMonth: [1, 2] },
      { cat: 'Travel', notes: ['Conference ticket', 'Hotel — 1 night'], min: 60, max: 280, perMonth: [0, 1] },
      { cat: 'Dining Out', notes: ['Client lunch', 'Airport dinner'], min: 18, max: 64, perMonth: [1, 2] },
    ],
  },
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

export function buildRows(now: Date, home = 'USD'): Row[] {
  const rows: Row[] = [];
  const profile = profileFor(home);
  // A figure written in dollars, in the home currency: scaled, and in whole units where the currency has no cents.
  const money = (usd: number) => (profile.whole ? Math.round(usd * profile.scale) : Math.round(usd * profile.scale * 100) / 100);
  // A figure already in the home currency.
  const local = (amount: number) => (profile.whole ? Math.round(amount) : amount);
  const fixed = (name: Fixed, usd: number) => profile.fixed[name] ?? money(usd);
  const note = (written: string) => profile.notes[written] ?? written;
  const foreign = foreignFor(home);
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

    // ── Income: money arrives the way it does in a real month — paychecks, side work most
    // months, and the small stuff (cashback, a friend paying back, something sold, interest).
    rows.push({ acct: 'checking', cat: 'Salary', type: 'CR', amount: fixed('salary', 2600), date: at(yy, mm, 1, 9, 5), note: note('Paycheck') });
    if (profile.paychecks === 2 && ok(15)) rows.push({ acct: 'checking', cat: 'Salary', type: 'CR', amount: fixed('salary', 2600), date: at(yy, mm, 15, 9, 5), note: note('Paycheck') });
    if (m % 4 !== 3) rows.push({ acct: 'checking', cat: 'Freelance', type: 'CR', amount: money(pick([450, 650, 850, 1200])), date: time(Math.min(18, lastDay)), note: pick(['Landing page project', 'Logo design', 'Consulting session', 'Website maintenance']) });
    if (ok(28)) rows.push({ acct: 'card', cat: 'Refunds', type: 'CR', amount: money(between(8, 24)), date: at(yy, mm, 28, 6, 30), note: 'Card cashback' });
    if (m % 2 === 0) rows.push({ acct: 'checking', cat: 'Other Income', type: 'CR', amount: money(between(22, 58)), date: time(day()), note: note(pick(['Sarah paid back brunch', 'Split bill settled'])), person: 0 });
    if (m % 3 === 1) rows.push({ acct: 'checking', cat: 'Other Income', type: 'CR', amount: money(between(40, 120)), date: time(day()), note: pick(['Expense reimbursement', 'Travel reimbursement']), person: 1 });
    if (m % 5 === 3) rows.push({ acct: 'cash', cat: 'Sales', type: 'CR', amount: money(pick([60, 120, 240])), date: time(day()), note: note(pick(['Sold old monitor', 'Sold bike rack', 'Sold textbooks'])) });
    if (m % 3 === 2 && ok(22)) rows.push({ acct: 'savings', cat: 'Dividends', type: 'CR', amount: money(between(38, 64)), date: at(yy, mm, 22, 10, 0), note: 'Quarterly dividend' });
    if (m > 0) rows.push({ acct: 'savings', cat: 'Interests', type: 'CR', amount: money(between(28, 36)), date: at(yy, mm, lastDay, 7, 0), note: 'Savings interest' });

    // ── Fixed bills
    rows.push({ acct: 'checking', cat: 'Rent', type: 'DR', amount: fixed('rent', 1850), date: at(yy, mm, 1, 10, 30), note: 'Monthly rent', person: 3 });
    if (ok(3)) rows.push({ acct: 'card', cat: 'Gym', type: 'DR', amount: fixed('gym', 39), date: at(yy, mm, 3, 7, 15), note: 'Gym membership' });
    if (ok(5)) rows.push({ acct: 'card', cat: 'Subscrip.', type: 'DR', amount: fixed('streaming', 15.49), date: at(yy, mm, 5, 6, 0), note: 'Streaming plan' });
    if (profile.emi && ok(5)) rows.push({ acct: 'checking', cat: 'Loan/EMI', type: 'DR', amount: profile.emi.amount, date: at(yy, mm, 5, 9, 30), note: profile.emi.note });
    if (ok(8)) rows.push({ acct: 'checking', cat: 'Internet', type: 'DR', amount: fixed('internet', 59.99), date: at(yy, mm, 8, 9, 0), note: note('Home internet') });
    if (ok(9)) rows.push({ acct: 'card', cat: 'Subscrip.', type: 'DR', amount: fixed('music', 10.99), date: at(yy, mm, 9, 6, 0), note: 'Music subscription' });
    if (ok(12)) rows.push({ acct: 'checking', cat: 'Electricity', type: 'DR', amount: money(between(72, 118)), date: at(yy, mm, 12, 9, 0), note: 'Electricity bill' });
    if (ok(15)) rows.push({ acct: 'checking', cat: 'Phone', type: 'DR', amount: fixed('phone', 45), date: at(yy, mm, 15, 9, 0), note: note('Phone plan') });
    if (ok(20)) rows.push({ acct: 'checking', cat: 'Insurance', type: 'DR', amount: fixed('insurance', 124), date: at(yy, mm, 20, 9, 0), note: note('Renters & auto insurance') });
    if (ok(2)) rows.push({ acct: 'checking', cat: 'Public Transit', type: 'DR', amount: fixed('transit', 65), date: at(yy, mm, 2, 8, 10), note: note('Monthly train pass') });

    // ── Transfers
    if (ok(2)) rows.push({ acct: 'checking', to: 'savings', cat: 'Transfer', type: 'TR', amount: money(1500), date: at(yy, mm, 2, 11, 0), note: 'Monthly savings' });
    if (ok(25)) rows.push({ acct: 'checking', to: 'card', cat: 'Transfer', type: 'TR', amount: money(between(780, 980)), date: at(yy, mm, 25, 11, 0), note: note('Card payment') });
    if (ok(6)) rows.push({ acct: 'checking', to: 'cash', cat: 'Transfer', type: 'TR', amount: money(80), date: at(yy, mm, 6, 17, 30), note: 'ATM withdrawal' });
    if (profile.wallet) {
      rows.push({ acct: 'checking', to: 'wallet', cat: 'Transfer', type: 'TR', amount: profile.wallet.topUp, date: at(yy, mm, 1, 10, 45), note: 'Wallet top-up' });
      if (ok(16)) rows.push({ acct: 'checking', to: 'wallet', cat: 'Transfer', type: 'TR', amount: profile.wallet.topUp, date: at(yy, mm, 16, 10, 45), note: 'Wallet top-up' });
    }

    // ── Everyday spending (current month is only a few days old, so scale counts down)
    const scale = lastDay / 30;
    for (const v of profile.variable) {
      const n = Math.round((v.perMonth[0] + Math.floor(rand() * (v.perMonth[1] - v.perMonth[0] + 1))) * (m === 0 ? Math.max(scale, 0.34) : 1));
      for (let i = 0; i < n; i++) {
        const written = pick(v.notes);
        rows.push({ acct: pick(v.accts), cat: v.cat, type: 'DR', amount: local(between(v.min, v.max)), date: time(day()), note: written, person: profile.shared[written] });
      }
    }

    // ── Accounts in other currencies
    for (const f of FOREIGN.filter((spec) => foreign.includes(spec.acct))) {
      for (const inc of f.income) {
        if (m % inc.every === 0 && ok(inc.day)) rows.push({ acct: f.acct, cat: inc.cat, type: 'CR', amount: inc.amount, date: at(yy, mm, inc.day, 10, 15), note: inc.note });
      }
      for (const v of f.spend) {
        const n = Math.round((v.perMonth[0] + Math.floor(rand() * (v.perMonth[1] - v.perMonth[0] + 1))) * (m === 0 ? Math.max(scale, 0.34) : 1));
        for (let i = 0; i < n; i++) rows.push({ acct: f.acct, cat: v.cat, type: 'DR', amount: Math.round(between(v.min, v.max)), date: time(day()), note: pick(v.notes) });
      }
    }

    // ── One-offs that give the year some shape
    if (m === 2) rows.push({ acct: 'card', cat: 'Travel', type: 'DR', amount: money(486.4), date: at(yy, mm, 14, 13, 20), note: note('Weekend trip — flights') });
    if (m === 2) rows.push({ acct: 'card', cat: 'Travel', type: 'DR', amount: money(312), date: at(yy, mm, 16, 15, 0), note: note('Lake cabin stay') });
    if (m === 4) rows.push({ acct: 'card', cat: 'Electronics', type: 'DR', amount: money(329), date: at(yy, mm, 11, 16, 40), note: 'Noise-cancelling headphones' });
    if (m === 6) rows.push({ acct: 'checking', cat: 'Refunds', type: 'CR', amount: money(218.5), date: at(yy, mm, 19, 12, 0), note: note('Tax refund') });
    if (m === 9) rows.push({ acct: 'checking', cat: 'Gifts', type: 'CR', amount: money(150), date: at(yy, mm, 24, 18, 0), note: 'Birthday gift' });
    if (m === 1) rows.push({ acct: 'card', cat: 'Gifts given', type: 'DR', amount: money(64), date: at(yy, mm, 21, 14, 0), note: 'Anniversary flowers' });
  }

  // The last few days carry money in as well as out, so Home's recent list and "This month"
  // open on a believable mix rather than a column of expenses.
  const daysAgo = (d: number, hour: number, minute: number) => at(now.getFullYear(), now.getMonth(), now.getDate() - d, hour, minute);
  rows.push({ acct: 'checking', cat: 'Freelance', type: 'CR', amount: money(780), date: daysAgo(1, 16, 40), note: 'Invoice paid — brand refresh' });
  rows.push({ acct: 'card', cat: 'Refunds', type: 'CR', amount: money(34.99), date: daysAgo(2, 11, 15), note: 'Refund — returned headphones case' });
  rows.push({ acct: 'checking', to: 'savings', cat: 'Transfer', type: 'TR', amount: money(250), date: daysAgo(3, 19, 5), note: 'Extra to savings' });

  // A small spend on every recent day without an entry keeps the logging streak unbroken.
  const daily = profile.daily;
  for (let d = 0; d < 26; d++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    const key = format(date, 'yyyy-MM-dd');
    if (!rows.some((r) => format(r.date, 'yyyy-MM-dd') === key)) {
      rows.push({ acct: daily.acct, cat: daily.cat, type: 'DR', amount: local(between(daily.min, daily.max)), date: at(date.getFullYear(), date.getMonth(), date.getDate(), 8, 20), note: daily.note });
    }
  }
  return rows.filter((r) => r.date <= now);
}

/** The accounts held in the home currency, which its budgets count. */
export const HOME_ACCOUNTS: readonly Acct[] = ['checking', 'savings', 'cash', 'card', 'wallet'];

export type BudgetSeed = { currency: 'home' | 'EUR'; cat: string | null; limit: number; rollover: boolean };

/**
 * One budget in each state the app can show, whatever day the data is made on: each limit is set
 * from what this month has spent so far and the share of it that should read as used. `fallback`
 * is the limit, in dollars, when nothing has been spent on it yet this month (the first days of a month).
 */
const BUDGET_PLAN: { currency: 'home' | 'EUR'; cat: string | null; used: number; fallback: number; rollover: boolean }[] = [
  { currency: 'home', cat: 'Groceries', used: 0.45, fallback: 450, rollover: true },
  { currency: 'home', cat: 'Dining Out', used: 0.86, fallback: 180, rollover: false },
  { currency: 'home', cat: 'Coffee', used: 1.18, fallback: 60, rollover: false },
  { currency: 'home', cat: 'Shopping', used: 0.3, fallback: 200, rollover: false },
  { currency: 'home', cat: null, used: 0.64, fallback: 3600, rollover: false },
  { currency: 'EUR', cat: 'Dining Out', used: 0.72, fallback: 160, rollover: false },
];

export function buildBudgets(rows: readonly Row[], now: Date, home = 'USD'): BudgetSeed[] {
  const profile = profileFor(home);
  const thisMonth = rows.filter((row) => row.type === 'DR' && row.date.getFullYear() === now.getFullYear() && row.date.getMonth() === now.getMonth());
  return BUDGET_PLAN.map((plan) => {
    const spent = thisMonth
      .filter((row) => (plan.currency === 'home' ? HOME_ACCOUNTS.includes(row.acct) : row.acct === 'eur') && (plan.cat === null || row.cat === plan.cat))
      .reduce((sum, row) => sum + row.amount, 0);
    // Rounded to a figure someone would choose, and never below two steps. The euro budget is always in euros.
    const scale = plan.currency === 'home' ? profile.scale : 1;
    const step = plan.currency === 'home' ? profile.budgetStep : 5;
    const limit = spent > 0 ? Math.max(2 * step, Math.round(spent / plan.used / step) * step) : plan.fallback * scale;
    return { currency: plan.currency, cat: plan.cat, limit, rollover: plan.rollover };
  });
}

/** Where each added account ends up, in dollars or its own currency; its opening balance is back-solved from what was logged. */
const CLOSING_BALANCE: Record<Exclude<Acct, 'checking' | 'wallet'>, number> = { savings: 26400, cash: 186.5, card: -412.18, usd: 2140.35, eur: 3480.6, try: 42750, inr: 186400 };

const FOREIGN_ACCOUNTS = [
  { key: 'usd', currency: 'USD', name: 'Dollar Account', accountNumber: '••••  4418', accountType: 'bank', color: shade('forest') },
  { key: 'eur', currency: 'EUR', name: 'Euro Account', accountNumber: '••••  3306', accountType: 'bank', color: shade('teal') },
  { key: 'try', currency: 'TRY', name: 'Lira Wallet', accountNumber: '', accountType: 'ewallet', color: shade('red') },
  { key: 'inr', currency: 'INR', name: 'Rupee Savings', accountNumber: '••••  5527', accountType: 'savings', color: shade('orange') },
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
    const profile = profileFor(home);
    const homeMoney = (usd: number) => (profile.whole ? Math.round(usd * profile.scale) : usd * profile.scale);

    const cats = await db.select().from(categories);
    const catId = (name: string) => {
      const c = cats.find((x) => x.name === name);
      if (!c) throw new Error(`Required category "${name}" is missing. Ensure base categories are seeded.`);
      return c.id;
    };

    // ── Accounts: three more in the home currency (four with a phone wallet), one in each other currency
    const base = { holderName: checking.holderName, isDefault: false, balance: 0, income: 0, expense: 0 };
    const foreign = foreignFor(home).map((key) => FOREIGN_ACCOUNTS.find((f) => f.key === key)!);
    const created = await db.insert(accounts).values([
      { ...base, currency: home, name: 'Savings', accountNumber: '••••  7203', accountType: 'savings' as const, icon: ACCOUNT_ICON, color: toDbColor(shade('blue')) },
      { ...base, currency: home, name: checking.name.trim().toLowerCase() === 'cash' ? 'Wallet' : 'Cash', accountNumber: '', accountType: 'cash' as const, icon: ACCOUNT_ICON, color: toDbColor(shade('amber')) },
      { ...base, currency: home, name: 'Credit Card', accountNumber: '••••  9914', accountType: 'credit_card' as const, icon: ACCOUNT_ICON, color: toDbColor(shade('purple')) },
      ...foreign.map((f) => ({ ...base, currency: f.currency, name: f.name, accountNumber: f.accountNumber, accountType: f.accountType, icon: ACCOUNT_ICON, color: toDbColor(f.color) })),
      ...(profile.wallet ? [{ ...base, currency: home, name: profile.wallet.name, accountNumber: '', accountType: 'ewallet' as const, icon: ACCOUNT_ICON, color: toDbColor(shade('lime')) }] : []),
    ]).returning();
    const acctId: Partial<Record<Acct, number>> = { checking: checking.id, savings: created[0].id, cash: created[1].id, card: created[2].id };
    foreign.forEach((f, i) => { acctId[f.key] = created[3 + i].id; });
    if (profile.wallet) acctId.wallet = created[3 + foreign.length].id;

    // ── People
    const people = await db.insert(persons).values(profile.people.map((p) => ({ ...p, color: toDbColor(p.color) }))).returning();
    const personId = (who?: Who) => (who === undefined ? null : people[who].id);

    // ── Transactions
    const rows = buildRows(now, home);
    const values = rows.flatMap((r) => {
      const accountId = acctId[r.acct];
      if (accountId === undefined) return [];
      const iso = r.date.toISOString();
      return [{
        accountId,
        toAccountId: r.to ? acctId[r.to] ?? null : null,
        categoryId: catId(r.cat),
        personId: personId(r.person),
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
    type LoanSeed = { acct: Acct; person: Who; type: 'lend' | 'borrow'; principal: number; status: 'active' | 'repaid'; dueIn?: number; note: string; opened: number; moves: [amount: number, type: 'CR' | 'DR', daysAgo: number, note: string][] };
    const loanSeeds: LoanSeed[] = [
      { acct: 'checking', person: 0, type: 'lend', principal: 500, status: 'active', dueIn: 28, note: 'Lent for travel expenses', opened: 15, moves: [[500, 'DR', 15, 'Loan given'], [150, 'CR', 6, 'Loan repayment received']] },
      { acct: 'checking', person: 1, type: 'borrow', principal: 1000, status: 'active', dueIn: 45, note: 'Borrowed for laptop repair', opened: 30, moves: [[1000, 'CR', 30, 'Loan received'], [400, 'DR', 10, 'Loan repayment sent']] },
      { acct: 'checking', person: 2, type: 'lend', principal: 300, status: 'active', dueIn: -5, note: 'Dinner split share', opened: 45, moves: [[300, 'DR', 45, 'Loan given']] },
      { acct: 'checking', person: 0, type: 'lend', principal: 200, status: 'repaid', note: 'Conference ticket split', opened: 75, moves: [[200, 'DR', 75, 'Loan given'], [200, 'CR', 40, 'Loan repayment received']] },
      { acct: 'eur', person: 2, type: 'lend', principal: 250, status: 'active', dueIn: 20, note: 'Shared hotel booking', opened: 12, moves: [[250, 'DR', 12, 'Loan given']] },
      { acct: 'usd', person: 2, type: 'borrow', principal: 600, status: 'active', dueIn: 60, note: 'Advance for flight tickets', opened: 22, moves: [[600, 'CR', 22, 'Loan received'], [150, 'DR', 4, 'Loan repayment sent']] },
      { acct: 'inr', person: 1, type: 'borrow', principal: 20000, status: 'active', dueIn: 60, note: 'Advance for flight tickets', opened: 22, moves: [[20000, 'CR', 22, 'Loan received'], [5000, 'DR', 4, 'Loan repayment sent']] },
    ];
    for (const [index, seed] of loanSeeds.entries()) {
      const accountId = acctId[seed.acct];
      if (accountId === undefined) continue;
      // Loans in the home currency take the profile's amounts, or the dollar ones scaled; the others are in their own.
      const sized = (amount: number, move: number) => (seed.acct === 'checking' ? profile.loans?.[index]?.[move] ?? homeMoney(amount) : amount);
      const l = { ...seed, principal: sized(seed.principal, 0), moves: seed.moves.map(([amount, ...rest], move) => [sized(amount, move), ...rest] as LoanSeed['moves'][number]) };
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

    // ── Budgets: one in each state, in the home currency, and one in euros where that account exists
    const budgetValues = buildBudgets(rows, now, home)
      .filter((b) => b.currency === 'home' || acctId.eur !== undefined)
      .map((b) => ({ categoryId: b.cat === null ? null : catId(b.cat), currency: b.currency === 'home' ? checking.currency : 'EUR', monthlyLimit: b.limit, rollover: b.rollover }));
    await db.insert(budgets).values(budgetValues);

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
    const closing = (key: Exclude<Acct, 'checking'>): number => {
      if (key === 'wallet') return profile.wallet?.closing ?? 0;
      if (key === 'savings' || key === 'cash' || key === 'card') return profile.fixed[key] ?? homeMoney(CLOSING_BALANCE[key]);
      return CLOSING_BALANCE[key];
    };
    for (const key of Object.keys(acctId) as Acct[]) {
      const id = acctId[key];
      if (id === undefined) continue;
      const t = totals[id] ?? { income: 0, expense: 0 };
      await db.update(accounts).set({
        balance: key === 'checking' ? sql`${accounts.balance} + ${cents(moved[id] ?? 0)}` : closing(key),
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
