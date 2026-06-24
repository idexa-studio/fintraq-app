import { sql } from 'drizzle-orm';
import { db } from '../client';
import { categories } from '../schema';

export const name = '006_category_multi_types';

export async function seed(): Promise<void> {
  // Loan/EMI: applicable to both CR (repayment in) and DR (lending out)
  await db
    .update(categories)
    .set({ type: 'CR,DR' })
    .where(sql`LOWER(${categories.name}) = 'loan/emi'`);

  // Uncategorized: truly universal — CR, DR, and TR
  await db
    .update(categories)
    .set({ type: 'CR,DR,TR' })
    .where(sql`LOWER(${categories.name}) = 'uncategorized'`);

  // Any remaining legacy 'ALL' rows (catch-all safety net)
  await db
    .update(categories)
    .set({ type: 'CR,DR,TR' })
    .where(sql`${categories.type} = 'ALL'`);
}
