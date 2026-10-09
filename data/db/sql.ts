import { isNull, sql } from 'drizzle-orm';
import { payments } from '@/data/db/schema';

/**
 * Timestamps are stored as UTC ISO strings (`toISOString()`), and SQLite's date() of those is the
 * UTC day — for users outside UTC that moves every payment made near midnight onto the wrong day
 * in totals, charts and filters, while the list (grouped in JS) shows the local day. Every SQL
 * date expression goes through these instead, so SQL and UI agree on which day a payment is.
 *
 * Zone-tagged values are shifted to the device's local time; any legacy value without a zone is
 * already local and is left as is ('+0 days' is SQLite's no-op modifier).
 */
const TO_LOCAL = sql.raw(
  `CASE WHEN "payments"."datetime" LIKE '%Z' OR "payments"."datetime" GLOB '*[+-][0-9][0-9]:[0-9][0-9]' THEN 'localtime' ELSE '+0 days' END`,
);

/** The payment's local calendar day, 'YYYY-MM-DD'. */
export const PAYMENT_LOCAL_DAY = sql<string>`date(${payments.datetime}, ${TO_LOCAL})`;
/** The payment's local month, 'YYYY-MM'. */
export const PAYMENT_LOCAL_MONTH = sql<string>`strftime('%Y-%m', ${payments.datetime}, ${TO_LOCAL})`;
/** The payment's local weekday, 0 = Sunday … 6 = Saturday. */
export const PAYMENT_LOCAL_WEEKDAY = sql<number>`CAST(strftime('%w', ${payments.datetime}, ${TO_LOCAL}) AS INTEGER)`;

/**
 * Money that is earned or spent, as opposed to lent, borrowed or repaid. A loan moves a balance,
 * so it is in the transaction list, but it is neither income nor spending: every total that says
 * "in", "out" or "spent" (Insights, Home's month, budgets) leaves it out, so they all agree.
 */
export const NOT_LOAN_MONEY = isNull(payments.loanId);
