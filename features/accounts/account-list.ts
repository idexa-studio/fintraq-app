import type { Account } from '@/data/repositories/accounts';
import { ACCOUNT_TYPES, typeOf } from '@/features/accounts/account-form';
import type { AccountType } from '@/shared/types';

export type AccountGroup = { type: AccountType; accounts: Account[] };

/** Accounts under their kind, kinds in their usual order; within a kind the default first, then by name. */
export function accountsByType(accounts: readonly Account[]): AccountGroup[] {
  return ACCOUNT_TYPES.map((type) => ({
    type,
    accounts: accounts.filter((account) => typeOf(account) === type).sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name)),
  })).filter((group) => group.accounts.length > 0);
}
