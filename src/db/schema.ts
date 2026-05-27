import { relations, sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  holderName: text('holderName').notNull(),
  accountNumber: text('accountNumber').notNull(),
  icon: text('icon').notNull().default('wallet'),
  color: integer('color').notNull(),
  isDefault: integer('isDefault', { mode: 'boolean' }).notNull().default(false),
  currency: text('currency').notNull().default('USD'),
  balance: real('balance').notNull().default(0),
  income: real('income').notNull().default(0),
  expense: real('expense').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const accountsRelations = relations(accounts, ({ many }) => ({
  payments: many(payments),
}));

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('grid'),
  color: integer('color').notNull(),
  type: text('type', { enum: ['CR', 'DR', 'TR'] }).notNull().default('DR'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  payments: many(payments),
}));

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  toAccountId: integer('to_account_id').references(() => accounts.id, { onDelete: 'set null' }),
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
  index('payments_datetime_idx').on(table.datetime),
]);

export const paymentsRelations = relations(payments, ({ one }) => ({
  account: one(accounts, {
    fields: [payments.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [payments.categoryId],
    references: [categories.id],
  }),
}));
