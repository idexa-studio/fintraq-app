import type { AccountType } from '@/src/types';

/**
 * Which account types can send a transfer.
 * loan and credit_card only receive money — they cannot originate transfers.
 */
const TRANSFER_SOURCE_BLOCKED: ReadonlySet<AccountType> = new Set(['loan', 'credit_card']);

/**
 * Valid destination types for each source account type.
 * Rules follow real-world financial logic:
 *   cash      → deposit to bank/savings/ewallet
 *   bank      → pay anything (credit card bills, loan EMIs, investments, other accounts)
 *   savings   → withdraw to bank/cash/ewallet
 *   ewallet   → cash out to bank/ewallet/cash
 *   investment→ liquidate to bank/savings
 */
const TRANSFER_COMPATIBLE_DESTINATIONS: Readonly<Record<AccountType, readonly AccountType[]>> = {
  cash:        ['bank', 'savings', 'ewallet'],
  bank:        ['bank', 'savings', 'cash', 'ewallet', 'credit_card', 'investment', 'loan'],
  savings:     ['bank', 'cash', 'ewallet'],
  ewallet:     ['bank', 'ewallet', 'cash'],
  investment:  ['bank', 'savings'],
  credit_card: [],
  loan:        [],
};

/**
 * Returns true if a transfer from `fromType` to `toType` is financially valid.
 * Always call with same-currency accounts; this function only checks type compatibility.
 */
export function isTransferCompatible(
  fromType: AccountType | null | undefined,
  toType: AccountType | null | undefined,
): boolean {
  if (!fromType || !toType) return true; // unknown type — don't block
  if (TRANSFER_SOURCE_BLOCKED.has(fromType)) return false;
  return (TRANSFER_COMPATIBLE_DESTINATIONS[fromType] as AccountType[]).includes(toType);
}

/** The fields of an account that decide where it can send money. */
type TransferParty = { id: number; currency: string; accountType: string | null };

/**
 * The accounts `from` can transfer to: same currency (balances never mix currencies), a
 * compatible type, and not itself. The one rule behind the transfer form's destination list and
 * every "can the user transfer at all?" check, so they can't disagree.
 */
export function transferDestinations<T extends TransferParty>(from: TransferParty, accounts: readonly T[]): T[] {
  return accounts.filter(
    (to) =>
      to.id !== from.id &&
      to.currency === from.currency &&
      isTransferCompatible(from.accountType as AccountType | null, to.accountType as AccountType | null),
  );
}

/** Whether any transfer can be made: some account has at least one valid destination. */
export function hasPossibleTransfer(accounts: readonly TransferParty[]): boolean {
  return accounts.some((from) => transferDestinations(from, accounts).length > 0);
}
