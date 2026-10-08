/** How many accounts Home stacks before the rest are counted. */
export const ACCOUNTS_STACKED = 5;

type Held = { id: number; balance: number; isDefault?: boolean | null };

export type AccountStack<T extends Held> = {
  /** The cards behind, each showing only its top edge, furthest back first. */
  behind: T[];
  /** The card in front, shown in full: the default account, or else the one holding most. */
  front: T | null;
  /** How many more accounts there are than are stacked. */
  more: number;
};

/**
 * Accounts as a stack of cards, like a wallet. The default account is in
 * front because it is the one used most; the rest sit behind it with the
 * largest holding nearest, so what matters most is closest to the eye.
 */
export function accountStack<T extends Held>(accounts: readonly T[], stacked: number = ACCOUNTS_STACKED): AccountStack<T> {
  if (accounts.length === 0) return { behind: [], front: null, more: 0 };
  const byHolding = [...accounts].sort((a, b) => b.balance - a.balance);
  const front = byHolding.find((account) => account.isDefault) ?? byHolding[0]!;
  const others = byHolding.filter((account) => account !== front).slice(0, stacked - 1);
  // Drawn top to bottom, so the furthest card comes first and the nearest sits just above the front one.
  return { behind: others.reverse(), front, more: Math.max(0, accounts.length - stacked) };
}

/** How far apart two colours must be, across red, green and blue, to be told apart as small dots. */
const TELL_APART = 36;

const channels = (hex: string): [number, number, number] => {
  const value = parseInt(hex.replace('#', '').slice(0, 6), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

/** True when two colours would read as the same one at the size of a dot. */
export function looksSame(a: string, b: string): boolean {
  const [r1, g1, b1] = channels(a);
  const [r2, g2, b2] = channels(b);
  return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2) < TELL_APART;
}

/**
 * One colour per stretch of the bar. Each keeps its own where it can; one
 * that would look like an earlier colour takes the first spare that looks
 * like none of them, so two accounts saved in similar colours can be told
 * apart.
 */
export function distinctColors(own: readonly string[], spare: readonly string[]): string[] {
  const used: string[] = [];
  const free = (candidate: string, among: readonly string[]) => !among.some((taken) => looksSame(taken, candidate));
  return own.map((color) => {
    const chosen = free(color, used) ? color : (spare.find((candidate) => free(candidate, [...used, ...own])) ?? spare.find((candidate) => free(candidate, used)) ?? color);
    used.push(chosen);
    return chosen;
  });
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
