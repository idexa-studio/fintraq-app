import { relations, sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
