import { REVIEW_AGAIN_DAYS, REVIEW_FROM_DAYS, REVIEW_FROM_TRANSACTIONS, shouldAskForReview } from '@/platform/config/review-rules';

const DAY = 24 * 60 * 60 * 1000;
const now = 1_800_000_000_000;
const settled = { firstLaunchAt: now - 30 * DAY, lastAskedAt: null, now, transactions: REVIEW_FROM_TRANSACTIONS };

describe('shouldAskForReview', () => {
  it('asks someone who has used the app for a few days and a few transactions', () => {
    expect(shouldAskForReview(settled)).toBe(true);
  });

  it('waits out the first days, and never asks before the first launch is known', () => {
    expect(shouldAskForReview({ ...settled, firstLaunchAt: now - (REVIEW_FROM_DAYS * DAY - 1) })).toBe(false);
    expect(shouldAskForReview({ ...settled, firstLaunchAt: now - REVIEW_FROM_DAYS * DAY })).toBe(true);
    expect(shouldAskForReview({ ...settled, firstLaunchAt: null })).toBe(false);
  });

  it('waits until enough is recorded, unless the caller does not count', () => {
    expect(shouldAskForReview({ ...settled, transactions: REVIEW_FROM_TRANSACTIONS - 1 })).toBe(false);
    expect(shouldAskForReview({ ...settled, transactions: undefined })).toBe(true);
  });

  it('does not ask again until its time has passed', () => {
    expect(shouldAskForReview({ ...settled, lastAskedAt: now - (REVIEW_AGAIN_DAYS * DAY - 1) })).toBe(false);
    expect(shouldAskForReview({ ...settled, lastAskedAt: now - REVIEW_AGAIN_DAYS * DAY })).toBe(true);
  });
});
