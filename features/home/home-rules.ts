/** How many accounts the balance card names before the rest are counted. */
export const ACCOUNTS_NAMED = 6;

type Held = { id: number; name: string; balance: number; color: number };

export type BalanceMakeup<T extends Held> = {
  /** The accounts that hold money, largest first: each is a stretch of the bar as wide as its share. */
  parts: T[];
  /** The accounts named under the bar: those in the bar first, then the ones that owe or are empty. */
  named: T[];
  /** How many more accounts there are than are named. */
  more: number;
};

/**
 * What a balance is made of. Only money held can be drawn as a share of a
 * bar; an account that owes (a card) or is empty is still named beneath it,
 * so every account is accounted for.
 */
export function balanceMakeup<T extends Held>(accounts: readonly T[], named: number = ACCOUNTS_NAMED): BalanceMakeup<T> {
  const parts = accounts.filter((account) => account.balance > 0).sort((a, b) => b.balance - a.balance);
  const rest = accounts.filter((account) => account.balance <= 0);
  const all = [...parts, ...rest];
  return { parts, named: all.slice(0, named), more: Math.max(0, all.length - named) };
}

export type MonthShape = {
  /** What the ring is a whole of: the larger of what came in and what went out. */
  whole: number;
  spent: number;
  kept: number;
  /** How the month reads, for the sentence beside the ring. */
  reading: 'nothing' | 'onlySpending' | 'spentMore' | 'spentAll' | 'kept';
  /** Share of income kept, 0 to 100. Zero unless the reading is `kept`. */
  keptPercent: number;
};

/** A month as two shares of one ring: what was spent, and what is left of what came in. */
export function monthShape(income: number, expense: number): MonthShape {
  const kept = Math.max(0, income - expense);
  const reading: MonthShape['reading'] =
    income === 0 && expense === 0 ? 'nothing'
    : income === 0 ? 'onlySpending'
    : expense > income ? 'spentMore'
    : expense === income ? 'spentAll'
    : 'kept';
  return { whole: Math.max(income, expense), spent: Math.min(expense, Math.max(income, expense)), kept, reading, keptPercent: reading === 'kept' ? Math.round((kept / income) * 100) : 0 };
}

/** The name a person is greeted or labelled by when there is room for one word. */
export const firstName = (name: string): string => name.trim().split(/\s+/)[0] ?? '';

/** The part of the day a greeting names. */
export type DayPart = 'morning' | 'afternoon' | 'evening';

/** Morning until noon, afternoon until five, evening after that and through the night. */
export const dayPart = (hour: number): DayPart => (hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 17 ? 'afternoon' : 'evening');
