/** Types of the domain that every layer shares. Their string values are stored in the database. */

/**
 * TransactionType: Represents the nature of a financial movement.
 * CR = Credit (Income / Inflow)
 * DR = Debit (Expense / Outflow)
 * TR = Transfer (Move funds between accounts)
 */
export type TransactionType = 'CR' | 'DR' | 'TR';

/**
 * AccountType: Classifies what kind of financial account this is.
 * Determines the icon shown across the app — no custom icon picker needed.
 */
export type AccountType =
  | 'cash'
  | 'bank'
  | 'savings'
  | 'credit_card'
  | 'investment'
  | 'loan'
  | 'ewallet';
