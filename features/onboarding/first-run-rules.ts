import { parseAmountInput } from '@/shared/format/amount';

/** The longest name the profile takes. */
export const NAME_MAX = 30;

/** The kinds of account offered on the way in: the everyday four. The rest are in the account form. */
export const FIRST_ACCOUNT_KINDS = ['cash', 'bank', 'ewallet', 'credit_card'] as const;
export type FirstAccountKind = (typeof FIRST_ACCOUNT_KINDS)[number];

/** Everything answered on the way in. Nothing is saved until the form is confirmed. */
export type SetupDraft = {
  name: string;
  currency: string;
  kind: FirstAccountKind;
  accountName: string;
  /** False until the user types a name, so choosing a kind can suggest one. */
  accountNamed: boolean;
  /** The opening balance as typed. Empty means nothing in it yet. */
  balance: string;
};

export const newSetupDraft = (currency: string, firstAccountName: string): SetupDraft => ({ name: '', currency, kind: 'cash', accountName: firstAccountName, accountNamed: false, balance: '' });

/** Choosing a kind names the account after it, until the user has named it themselves. */
export const withKind = (draft: SetupDraft, kind: FirstAccountKind, kindName: string): SetupDraft => ({ ...draft, kind, accountName: draft.accountNamed ? draft.accountName : kindName });

export const withAccountName = (draft: SetupDraft, accountName: string): SetupDraft => ({ ...draft, accountName, accountNamed: true });

/** The opening balance as a number: nothing typed is zero; something unreadable is null. */
export function openingBalance(typed: string): number | null {
  return typed.trim() ? parseAmountInput(typed) : 0;
}

/** Why setup cannot be finished yet, in the order the form asks, or null when it can. */
export type SetupBlocker = 'name' | 'accountName' | 'balance';

export function setupBlockerOf(draft: SetupDraft): SetupBlocker | null {
  if (!draft.name.trim()) return 'name';
  if (!draft.accountName.trim()) return 'accountName';
  if (openingBalance(draft.balance) === null) return 'balance';
  return null;
}
