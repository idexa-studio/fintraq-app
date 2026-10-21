import { relations, sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const persons = sqliteTable('persons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  designation: text('designation'),
  company: text('company'),
  color: integer('color').notNull(),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('persons_name_idx').on(table.name),
]);

export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  holderName: text('holderName').notNull(),
  accountNumber: text('accountNumber').notNull(),
  icon: text('icon').notNull().default('building'),
  accountType: text('account_type', {
    enum: ['cash', 'bank', 'savings', 'credit_card', 'investment', 'loan', 'ewallet'],
  }).default('bank'),
  color: integer('color').notNull(),
  isDefault: integer('isDefault', { mode: 'boolean' }).notNull().default(false),
  currency: text('currency').notNull().default('USD'),
  balance: real('balance').notNull().default(0),
  income: real('income').notNull().default(0),
  expense: real('expense').notNull().default(0),
  /**
   * Whether the balance counts in what Home shows as ready to spend (release 2.1.0). Null: decided
   * by the kind of account (savings and investments are put aside); set only once changed by hand.
   */
  countsAsSpendable: integer('counts_as_spendable', { mode: 'boolean' }),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('grid'),
  color: integer('color').notNull(),
  type: text('type').notNull().default('DR'),
  isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const loans = sqliteTable('loans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  personId: integer('person_id').references(() => persons.id, { onDelete: 'set null' }),
  type: text('type', { enum: ['lend', 'borrow'] }).notNull(),
  principal: real('principal').notNull(),
  currency: text('currency').notNull(),
  accountId: integer('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  dueDate: text('due_date'),
  note: text('note').notNull().default(''),
  status: text('status', { enum: ['active', 'repaid', 'overdue'] }).notNull().default('active'),
  emiReminderEnabled: integer('emi_reminder_enabled', { mode: 'boolean' }).notNull().default(false),
  emiReminderDay: integer('emi_reminder_day'),
  emiReminderTime: text('emi_reminder_time'),
  emiNotificationIds: text('emi_notification_ids'),
  dueReminderEnabled: integer('due_reminder_enabled', { mode: 'boolean' }).notNull().default(false),
  dueReminderDaysBefore: integer('due_reminder_days_before'),
  /** "HH:mm"; null falls back to the EMI time, then 09:00. */
  dueReminderTime: text('due_reminder_time'),
  dueNotificationId: text('due_notification_id'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('loans_person_id_idx').on(table.personId),
  index('loans_status_idx').on(table.status),
  index('loans_currency_idx').on(table.currency),
]);

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  toAccountId: integer('to_account_id').references(() => accounts.id, { onDelete: 'set null' }),
  personId: integer('person_id').references(() => persons.id, { onDelete: 'set null' }),
  loanId: integer('loan_id').references(() => loans.id, { onDelete: 'set null' }),
  amount: real('amount').notNull(),
  type: text('type', { enum: ['CR', 'DR', 'TR'] }).notNull(),
  datetime: text('datetime').notNull(),
  note: text('note').notNull(),
  /**
   * The repeating item that made this transaction, and the day it was made for (YYYY-MM-DD), so
   * no occurrence is ever made twice (release 2.1.0). Plain columns, not a foreign key: adding a
   * key to this table would make the migration rebuild it, copying every transaction a user has.
   * Deleting an item clears these and keeps the transactions.
   */
  recurringRuleId: integer('recurring_rule_id'),
  recurringDate: text('recurring_date'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('payments_account_id_idx').on(table.accountId),
  index('payments_category_id_idx').on(table.categoryId),
  index('payments_to_account_id_idx').on(table.toAccountId),
  index('payments_person_id_idx').on(table.personId),
  index('payments_datetime_idx').on(table.datetime),
  index('payments_type_idx').on(table.type),
  index('payments_account_datetime_idx').on(table.accountId, table.datetime),
  index('payments_loan_id_idx').on(table.loanId),
  uniqueIndex('payments_recurring_occurrence_idx').on(table.recurringRuleId, table.recurringDate),
]);

/**
 * A monthly limit on spending. `categoryId` null is the budget over all spending in that
 * currency; there is at most one of those per currency, which the repository holds, since SQLite
 * treats two nulls as different in a unique index.
 */
export const budgets = sqliteTable('budgets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'cascade' }),
  currency: text('currency').notNull(),
  monthlyLimit: real('monthly_limit').notNull(),
  rollover: integer('rollover', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  uniqueIndex('budgets_category_currency_idx').on(table.categoryId, table.currency),
]);

/**
 * A repeating item (release 2.1.0): a transaction's fields kept on their own, so editing or
 * deleting a transaction it made never changes the item. Its account, destination, category or
 * person going away sets that field to null, which stops the item until another is chosen.
 */
export const recurringRules = sqliteTable('recurring_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', { enum: ['CR', 'DR', 'TR'] }).notNull(),
  amount: real('amount').notNull(),
  accountId: integer('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  toAccountId: integer('to_account_id').references(() => accounts.id, { onDelete: 'set null' }),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  personId: integer('person_id').references(() => persons.id, { onDelete: 'set null' }),
  note: text('note').notNull().default(''),
  cadence: text('cadence', { enum: ['week', 'twoWeeks', 'month', 'year'] }).notNull(),
  /** The day it repeats from (YYYY-MM-DD): a monthly item on the 31st keeps the 31st after a short month. */
  anchorDate: text('anchor_date').notNull(),
  /** The time of day its transactions take (HH:mm), the original's. */
  time: text('time').notNull(),
  /** The next day it is due (YYYY-MM-DD). */
  nextDue: text('next_due').notNull(),
  /** `ask`: waits on Home on its day. `add`: made by itself. */
  mode: text('mode', { enum: ['ask', 'add'] }).notNull().default('ask'),
  ends: text('ends', { enum: ['never', 'date', 'times'] }).notNull().default('never'),
  endDate: text('end_date'),
  endTimes: integer('end_times'),
  /** Occurrences passed, made or skipped, counted against `endTimes`. */
  occurrences: integer('occurrences').notNull().default(0),
  paused: integer('paused', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('recurring_rules_next_due_idx').on(table.nextDue),
]);

export const accountsRelations = relations(accounts, ({ many }) => ({
  payments: many(payments),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  payments: many(payments),
  loans: many(loans),
}));

export const personsRelations = relations(persons, ({ many }) => ({
  payments: many(payments),
  loans: many(loans),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  person: one(persons, { fields: [loans.personId], references: [persons.id] }),
  account: one(accounts, { fields: [loans.accountId], references: [accounts.id] }),
  category: one(categories, { fields: [loans.categoryId], references: [categories.id] }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  account: one(accounts, {
    fields: [payments.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [payments.categoryId],
    references: [categories.id],
  }),
  person: one(persons, {
    fields: [payments.personId],
    references: [persons.id],
  }),
  loan: one(loans, {
    fields: [payments.loanId],
    references: [loans.id],
  }),
}));

export const seederState = sqliteTable('seeder_state', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  executedAt: text('executed_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});
