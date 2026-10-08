import { LEGACY_ICON_MAP } from '@/shared/contracts/legacy-icon-names';
import type { AccountType } from '@/shared/types';
import { isIconName } from '@/src/components/ui/icon-registry';
import type { IconName } from '@/src/components/ui/icon-registry';

// String type aliases for icon name strings stored in DB
export type MaterialIconName = string;
export type IoniconName = string;

/**
 * A stored icon string (category / account, from the database) as a registry name, mapping
 * pre-Hugeicons names through LEGACY_ICON_MAP. Returns the fallback for anything unrecognised.
 */
export function resolveIcon(icon: string | null | undefined, fallback: IconName): IconName {
  if (!icon) return fallback;
  const key = LEGACY_ICON_MAP[icon] || icon;
  return isIconName(key) ? key : fallback;
}

export const ACCOUNT_TYPE_ICON_MAP: Record<AccountType, IconName> = {
  cash: 'cash',
  bank: 'building',
  savings: 'piggy-bank',
  credit_card: 'credit-card',
  investment: 'chart-line-data',
  loan: 'receipt-text',
  ewallet: 'wallet',
};

export function resolveAccountTypeIcon(accountType: AccountType | null | undefined): IconName {
  if (!accountType) return 'building';
  return ACCOUNT_TYPE_ICON_MAP[accountType] ?? 'building';
}
