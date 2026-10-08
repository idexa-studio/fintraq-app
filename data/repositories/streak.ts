import { desc, sql } from 'drizzle-orm';
import { db } from '@/data/db/client';
import { PAYMENT_LOCAL_DAY } from '@/data/db/sql';
import { payments } from '@/data/db/schema';
import { getDaysAgoLocal, getLocalISOString, parseDateKey } from '@/shared/date/date';

/**
 * getCurrentStreak: Calculates the current usage streak based on days with transactions.
 * 
 * Primitive-first logic:
 * 1. Fetch unique transaction dates (YYYY-MM-DD) for the last 90 days.
 * 2. Verify if 'today' or 'yesterday' is the starting point in local time.
 * 3. Count consecutive days backwards.
 */
export async function getCurrentStreak(): Promise<number> {
  const ninetyDaysAgo = getDaysAgoLocal(90);

  // Get unique local dates where payments occurred
  const allDates = await db
    .select({
      date: PAYMENT_LOCAL_DAY
    })
    .from(payments)
    .where(sql`${PAYMENT_LOCAL_DAY} >= ${ninetyDaysAgo}`)
    .groupBy(PAYMENT_LOCAL_DAY)
    .orderBy(desc(PAYMENT_LOCAL_DAY));

  if (allDates.length === 0) return 0;

  const dates = allDates.map(d => d.date);

  const today = getLocalISOString();
  const yesterday = getDaysAgoLocal(1);

  // If the latest date is neither today nor yesterday, the streak is broken
  const latestDate = dates[0];
  if (latestDate !== today && latestDate !== yesterday) {
    return 0;
  }

  let streak = 0;
  // Walk back day by day from the latest local day (parsed as local midnight — new Date('YYYY-MM-DD')
  // is UTC, which starts on the wrong day west of UTC and broke every streak there).
  const currentDate = parseDateKey(latestDate);

  for (const dateStr of dates) {
    const expectedStr = getLocalISOString(currentDate);

    if (dateStr === expectedStr) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
