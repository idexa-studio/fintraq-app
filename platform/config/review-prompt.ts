import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { shouldAskForReview } from '@/platform/config/review-rules';
import { Analytics } from '@/platform/telemetry';
import type { ReviewTrigger } from '@/platform/telemetry';
import { LoggerService } from '@/shared/logging/logger';
import { StorageKeys } from '@/shared/contracts/storage-keys';

const STORAGE_KEY_FIRST_LAUNCH_AT = StorageKeys.FIRST_LAUNCH_AT;
const STORAGE_KEY_REVIEW_REQUESTED = StorageKeys.REVIEW_REQUESTED_AT;

const stamp = (value: string | null): number | null => {
  const at = Number.parseInt(value ?? '', 10);
  return Number.isFinite(at) ? at : null;
};

export const ReviewPromptService = {
  /** Records first-launch timestamp once; no-op on repeat calls. */
  async ensureFirstLaunchRecorded(): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEY_FIRST_LAUNCH_AT);
      if (existing) return;
      await AsyncStorage.setItem(STORAGE_KEY_FIRST_LAUNCH_AT, String(Date.now()));
    } catch (e) {
      LoggerService.warn('REVIEW_PROMPT', 'Failed to record first-launch timestamp', e);
    }
  },

  /**
   * Asks the phone to show its own review prompt, if this is a moment for it (`shouldAskForReview`).
   * Call straight after something went well (`moment`): a saved transaction, a loan settled, a finished
   * backup. Pass how many transactions are recorded where it is known. The stores decide whether the
   * prompt really appears; `review_requested` counts each ask.
   */
  async maybeRequestReview(moment: ReviewTrigger, known: { transactions?: number } = {}): Promise<void> {
    try {
      const [firstLaunch, lastAsked, isAvailable] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_FIRST_LAUNCH_AT),
        AsyncStorage.getItem(STORAGE_KEY_REVIEW_REQUESTED),
        StoreReview.isAvailableAsync(),
      ]);
      const now = Date.now();
      if (!isAvailable || !shouldAskForReview({ firstLaunchAt: stamp(firstLaunch), lastAskedAt: stamp(lastAsked), now, transactions: known.transactions })) return;

      await AsyncStorage.setItem(STORAGE_KEY_REVIEW_REQUESTED, String(now));
      Analytics.track('review_requested', { moment });
      await StoreReview.requestReview();
    } catch (e) {
      LoggerService.warn('REVIEW_PROMPT', 'Failed to request app review', e);
    }
  },
};
