import type { Account, InsertAccount, UpdateAccountData } from '@/data/repositories/accounts';
import { parseAmountInput } from '@/shared/format/amount';
import { colorNumberToHex, toDbColor } from '@/shared/format/color';
import type { AccountType } from '@/shared/types';

/** The kinds of account, in the order they are offered and listed. */
export const ACCOUNT_TYPES: readonly AccountType[] = ['bank', 'cash', 'savings', 'credit_card', 'ewallet', 'investment', 'loan'];

export const NAME_MIN = 2;
export const NAME_MAX = 50;
export const HOLDER_MAX = 50;
export const NUMBER_MAX = 100;

/** What the form holds while an account is being made or changed. */
export type AccountDraft = {
  name: string;
  type: AccountType;
  currency: string;
  /** As typed. Only asked for a new account: afterwards the balance belongs to its transactions. */
  openingBalance: string;
  holderName: string;
  accountNumber: string;
  /** Hex, from the saved palette. */
  color: string;
};

/** Why the form cannot be saved yet. */
export type AccountBlocker = 'name' | 'balance';

export const typeOf = (account: Pick<Account, 'accountType'>): AccountType => (account.accountType as AccountType | null) ?? 'bank';

export const newDraft = (currency: string, color: string): AccountDraft => ({ name: '', type: 'bank', currency, openingBalance: '', holderName: '', accountNumber: '', color });

export const draftOf = (account: Account): AccountDraft => ({
  name: account.name,
  type: typeOf(account),
  currency: account.currency,
  openingBalance: '',
  holderName: account.holderName,
  accountNumber: isRealNumber(account.accountNumber) ? account.accountNumber : '',
  color: colorNumberToHex(account.color).toUpperCase(),
});

/** An opening balance is optional, and never below zero. */
const openingOf = (text: string): number | null => {
  if (!text.trim()) return 0;
  // The reader ignores a sign, so a typed minus is refused here rather than silently dropped.
  return text.trim().startsWith('-') ? null : parseAmountInput(text);
};

export function blockerOf(draft: AccountDraft, editing: boolean): AccountBlocker | null {
  if (draft.name.trim().length < NAME_MIN) return 'name';
  if (!editing && openingOf(draft.openingBalance) === null) return 'balance';
  return null;
}

export const createPayloadOf = (draft: AccountDraft): InsertAccount => ({
  name: draft.name.trim(),
  holderName: draft.holderName.trim(),
  accountNumber: draft.accountNumber.trim(),
  balance: openingOf(draft.openingBalance) ?? 0,
  currency: draft.currency,
  color: toDbColor(draft.color),
  // Accounts are drawn by their kind; the column keeps the value every version has written.
  icon: 'building',
  accountType: draft.type,
  isDefault: false,
});

/** The kind is fixed once made, and so is the currency once anything is recorded in it. */
export const updatePayloadOf = (draft: AccountDraft, currencyLocked: boolean): UpdateAccountData => ({
  name: draft.name.trim(),
  holderName: draft.holderName.trim(),
  accountNumber: draft.accountNumber.trim(),
  color: toDbColor(draft.color),
  ...(currencyLocked ? null : { currency: draft.currency }),
});

export const isChanged = (draft: AccountDraft, from: AccountDraft): boolean => (Object.keys(draft) as (keyof AccountDraft)[]).some((key) => draft[key] !== from[key]);

/** Older versions wrote "N/A" where no number was given. */
const isRealNumber = (accountNumber: string | null | undefined): accountNumber is string => !!accountNumber && accountNumber.trim() !== '' && accountNumber !== 'N/A';

/** The last four characters of the number, the rest hidden; nothing when no number was given. */
export const maskedNumber = (accountNumber: string | null | undefined): string | null => (isRealNumber(accountNumber) ? `•••• ${accountNumber.trim().slice(-4)}` : null);
