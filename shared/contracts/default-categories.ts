import { toDbColor } from '@/shared/format/color';

export type DefaultCategory = { name: string; icon: string; color: number; type: string; isSystem?: boolean };

/**
 * The single catch-all: system-owned (can't be edited or deleted), valid for
 * every transaction type, and the fallback wherever a category is required.
 * Replaced the old "Uncategorized" + "Other" pair (seed 008 merges them).
 */
export const OTHERS_CATEGORY = {
  name: 'Others',
  icon: 'more-horizontal',
  color: toDbColor('#475569'),
  type: 'CR,DR,TR',
  isSystem: true,
} as const;

/** Categories created on first launch. Icons are keys into ICON_MAP; colours are user-data colours. */
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // ── Income ──────────────────────────────────────────────────────
  { name: 'Salary', icon: 'cash', color: toDbColor('#059669'), type: 'CR' },
  { name: 'Freelance', icon: 'sparkles', color: toDbColor('#65A30D'), type: 'CR' },
  { name: 'Sales', icon: 'shopping-cart', color: toDbColor('#D97706'), type: 'CR' },
  { name: 'Dividends', icon: 'chart-up', color: toDbColor('#2563EB'), type: 'CR' },
  { name: 'Interests', icon: 'chart-bar-increasing', color: toDbColor('#7C3AED'), type: 'CR' },
  { name: 'Gifts', icon: 'gift', color: toDbColor('#BE185D'), type: 'CR' },
  { name: 'Refunds', icon: 'refresh', color: toDbColor('#059669'), type: 'CR' },
  { name: 'Other Income', icon: 'building', color: toDbColor('#334155'), type: 'CR' },

  // ── Housing & Utilities ──────────────────────────────────────────
  { name: 'Rent', icon: 'building', color: toDbColor('#EA580C'), type: 'DR' },
  { name: 'Mortgage', icon: 'home', color: toDbColor('#DC2626'), type: 'DR' },
  { name: 'Electricity', icon: 'flash', color: toDbColor('#D97706'), type: 'DR' },
  { name: 'Water', icon: 'droplets', color: toDbColor('#0369A1'), type: 'DR' },
  { name: 'Internet', icon: 'wifi', color: toDbColor('#4338CA'), type: 'DR' },
  { name: 'Phone', icon: 'smartphone', color: toDbColor('#4F46E5'), type: 'DR' },
  { name: 'Maintenance', icon: 'wrench', color: toDbColor('#475569'), type: 'DR' },

  // ── Food & Drink ────────────────────────────────────────────────
  { name: 'Groceries', icon: 'shopping-basket', color: toDbColor('#B45309'), type: 'DR' },
  { name: 'Dining Out', icon: 'fork', color: toDbColor('#EA580C'), type: 'DR' },
  { name: 'Delivery', icon: 'bike', color: toDbColor('#DC2626'), type: 'DR' },
  { name: 'Coffee', icon: 'coffee', color: toDbColor('#B45309'), type: 'DR' },
  { name: 'Drinks', icon: 'drink', color: toDbColor('#6D28D9'), type: 'DR' },

  // ── Transport ───────────────────────────────────────────────────
  { name: 'Fuel', icon: 'dashboard-speed', color: toDbColor('#EA580C'), type: 'DR' },
  { name: 'Car Payment', icon: 'car', color: toDbColor('#2563EB'), type: 'DR' },
  { name: 'Public Transit', icon: 'bus', color: toDbColor('#0E7490'), type: 'DR' },
  { name: 'Ride Share', icon: 'car', color: toDbColor('#059669'), type: 'DR' },
  { name: 'Parking', icon: 'map-pin', color: toDbColor('#334155'), type: 'DR' },

  // ── Health & Wellness ───────────────────────────────────────────
  { name: 'Health', icon: 'bandage', color: toDbColor('#BE123C'), type: 'DR' },
  { name: 'Pharmacy', icon: 'bandage', color: toDbColor('#059669'), type: 'DR' },
  { name: 'Gym', icon: 'dumbbell', color: toDbColor('#059669'), type: 'DR' },
  { name: 'Personal Care', icon: 'scissor', color: toDbColor('#BE185D'), type: 'DR' },

  // ── Lifestyle & Fun ──────────────────────────────────────────────
  { name: 'Shopping', icon: 'shopping-bag', color: toDbColor('#BE185D'), type: 'DR' },
  { name: 'Electronics', icon: 'cpu', color: toDbColor('#4338CA'), type: 'DR' },
  { name: 'Subscrip.', icon: 'repeat', color: toDbColor('#7C3AED'), type: 'DR' },
  { name: 'Entertainment', icon: 'film', color: toDbColor('#E11D48'), type: 'DR' },
  { name: 'Travel', icon: 'airplane', color: toDbColor('#0E7490'), type: 'DR' },
  { name: 'Games', icon: 'gamepad', color: toDbColor('#7C3AED'), type: 'DR' },
  { name: 'Books', icon: 'book-open', color: toDbColor('#D97706'), type: 'DR' },

  // ── Family & Education ──────────────────────────────────────────
  { name: 'Education', icon: 'school', color: toDbColor('#0369A1'), type: 'DR' },
  { name: 'Kids', icon: 'smile', color: toDbColor('#D97706'), type: 'DR' },
  { name: 'Pets', icon: 'cat', color: toDbColor('#65A30D'), type: 'DR' },
  { name: 'Gifts given', icon: 'heart', color: toDbColor('#E11D48'), type: 'DR' },

  // ── Finance & Taxes ─────────────────────────────────────────────
  { name: 'Loan/EMI', icon: 'credit-card', color: toDbColor('#DC2626'), type: 'CR,DR' },
  { name: 'Taxes', icon: 'file', color: toDbColor('#475569'), type: 'DR' },
  { name: 'Insurance', icon: 'shield', color: toDbColor('#334155'), type: 'DR' },
  { name: 'Fees', icon: 'receipt-text', color: toDbColor('#334155'), type: 'DR' },

  // ── Transfers ────────────────────────────────────────────────────
  { name: 'Transfer', icon: 'repeat', color: toDbColor('#2563EB'), type: 'TR', isSystem: true },
  { ...OTHERS_CATEGORY },
];
