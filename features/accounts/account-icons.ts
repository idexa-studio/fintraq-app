import type { IconName } from '@/design';
import type { AccountType } from '@/shared/types';

/** An account is drawn by its kind; accounts have no icon of their own to choose. */
const ACCOUNT_TYPE_ICONS: Record<AccountType, IconName> = {
  cash: 'cash',
  bank: 'bank',
  savings: 'piggy-bank',
  credit_card: 'credit-card',
  investment: 'chart-line-data',
  loan: 'receipt-text',
  ewallet: 'wallet',
};

export const accountTypeIcon = (type: string | null | undefined): IconName => ACCOUNT_TYPE_ICONS[type as AccountType] ?? 'bank';
