import type { AccountType } from '@/shared/types';

/**
 * Money ready to spend against money put aside (release 2.1.0, plan task O1.01). An account counts
 * as ready to spend unless it is put aside: by its own setting once changed by hand, or else by its
 * kind. A card's or a loan's balance below zero takes from what is ready, as it does today.
 */

/** Kinds of account put aside unless their owner says otherwise. */
export const PUT_ASIDE_KINDS: readonly AccountType[] = ['savings', 'investment'];

type Counted = { accountType: AccountType | null; countsAsSpendable: boolean | null };
type Held = Counted & { currency: string; balance: number };

/** Whether an account's balance counts in what is ready to spend. */
export const countsAsSpendable = (account: Counted): boolean =>
  account.countsAsSpendable ?? !PUT_ASIDE_KINDS.includes(account.accountType ?? 'bank');

export type SpendableSplit = {
  /** What Home shows: the accounts that count. */
  ready: number;
  /** What is put aside, and in how many accounts. */
  putAside: number;
  putAsideAccounts: number;
  /** The accounts that count, for the line that says how many make up the figure. */
  readyAccounts: number;
};

/** The split for one currency. The two parts always add up to what every account holds. */
export function spendableSplit(accounts: readonly Held[], currency: string): SpendableSplit {
  const split: SpendableSplit = { ready: 0, putAside: 0, putAsideAccounts: 0, readyAccounts: 0 };
  for (const account of accounts) {
    if (account.currency !== currency) continue;
    if (countsAsSpendable(account)) {
      split.ready += account.balance;
      split.readyAccounts += 1;
    } else {
      split.putAside += account.balance;
      split.putAsideAccounts += 1;
    }
  }
  return split;
}
