import { db } from '../../../db/client';
import { categories, payments, loans } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export const getCategories = async (): Promise<Category[]> => {
  return await db.select().from(categories);
};

export const createCategory = async (data: InsertCategory) => {
  const result = await db.insert(categories).values(data).returning();
  return result[0];
};

export const updateCategory = async (id: number, data: Partial<InsertCategory>) => {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  if (category && category.isSystem) {
    throw new Error('System-reserved categories cannot be modified.');
  }

  const result = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
  return result[0];
};

export const deleteCategory = async (id: number) => {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  if (!category) {
    throw new Error('Category not found.');
  }

  if (category.isSystem) {
    throw new Error('System-reserved categories cannot be deleted.');
  }

  // Check if any payments are linked to this category
  const [linkedPayment] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.categoryId, id))
    .limit(1);

  if (linkedPayment) {
    throw new Error('This category is linked to transactions and cannot be deleted.');
  }

  // Check if any loans are linked to this category
  const [linkedLoan] = await db
    .select({ id: loans.id })
    .from(loans)
    .where(eq(loans.categoryId, id))
    .limit(1);

  if (linkedLoan) {
    throw new Error('This category is linked to loans and cannot be deleted.');
  }

  return await db.delete(categories).where(eq(categories.id, id));
};
