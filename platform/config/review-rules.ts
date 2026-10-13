const DAY_MS = 24 * 60 * 60 * 1000;

/** The app has to have been in use this long before it asks. */
export const REVIEW_FROM_DAYS = 3;
/** And this much has to have been recorded, where the count is known. */
export const REVIEW_FROM_TRANSACTIONS = 10;
/** Once asked, it does not ask again for this long. The stores keep their own, stricter count on top. */
export const REVIEW_AGAIN_DAYS = 90;

export type ReviewMoment = {
  /** When the app was first opened on this phone, in milliseconds; null if never recorded. */
  firstLaunchAt: number | null;
  /** When a review was last asked for, in milliseconds; null if never. */
  lastAskedAt: number | null;
  now: number;
  /** How many transactions are recorded, when the caller knows. A caller that does not is asking after something only a settled user does. */
  transactions?: number;
};

/**
 * Whether this is a moment to ask for a review: the app has been used for a few days and for a
 * few transactions, and it has not asked lately. Called only straight after something went well.
 */
export function shouldAskForReview({ firstLaunchAt, lastAskedAt, now, transactions }: ReviewMoment): boolean {
  if (firstLaunchAt === null || now - firstLaunchAt < REVIEW_FROM_DAYS * DAY_MS) return false;
  if (transactions !== undefined && transactions < REVIEW_FROM_TRANSACTIONS) return false;
  return lastAskedAt === null || now - lastAskedAt >= REVIEW_AGAIN_DAYS * DAY_MS;
}
