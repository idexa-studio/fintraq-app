import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { LoggerService } from '@/src/services/logger.service';

const STORAGE_KEY_FIRST_LAUNCH_AT = '@fintraq_first_launch_at';
const STORAGE_KEY_REVIEW_REQUESTED = '@fintraq_review_requested_at';

const MIN_DAYS_SINCE_INSTALL = 2;
const MIN_DAYS_SINCE_INSTALL_MS = MIN_DAYS_SINCE_INSTALL * 24 * 60 * 60 * 1000;

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

  /** Asks OS to show review prompt once, 2+ days after install. Call from a positive moment. */
  async maybeRequestReview(): Promise<void> {
    try {
      const [firstLaunchStr, alreadyRequested, isAvailable] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_FIRST_LAUNCH_AT),
        AsyncStorage.getItem(STORAGE_KEY_REVIEW_REQUESTED),
        StoreReview.isAvailableAsync(),
      ]);

      if (alreadyRequested || !isAvailable) return;

      const firstLaunchAt = firstLaunchStr ? parseInt(firstLaunchStr, 10) : Date.now();
      const daysSinceInstall = Date.now() - firstLaunchAt;
      if (daysSinceInstall < MIN_DAYS_SINCE_INSTALL_MS) return;

      await AsyncStorage.setItem(STORAGE_KEY_REVIEW_REQUESTED, String(Date.now()));
      await StoreReview.requestReview();
    } catch (e) {
      LoggerService.warn('REVIEW_PROMPT', 'Failed to request app review', e);
    }
  },
};
