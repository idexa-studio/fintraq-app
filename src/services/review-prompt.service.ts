import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const STORAGE_KEY_FIRST_LAUNCH_AT = '@fintraq_first_launch_at';
const STORAGE_KEY_REVIEW_REQUESTED = '@fintraq_review_requested_at';

const MIN_DAYS_SINCE_INSTALL = 2;
const MIN_DAYS_SINCE_INSTALL_MS = MIN_DAYS_SINCE_INSTALL * 24 * 60 * 60 * 1000;

export const ReviewPromptService = {
  /**
   * Records the first-launch timestamp exactly once. Call unconditionally on
   * every app start — it's a no-op after the first call ever succeeds.
   */
  async ensureFirstLaunchRecorded(): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEY_FIRST_LAUNCH_AT);
      if (existing) return;
      await AsyncStorage.setItem(STORAGE_KEY_FIRST_LAUNCH_AT, String(Date.now()));
    } catch (e) {
      console.warn('[ReviewPromptService] ensureFirstLaunchRecorded failed:', e);
    }
  },

  /**
   * Asks the OS to show the native in-app review prompt, but only once ever,
   * and only once at least 2 days have passed since first launch. Call this
   * from a positive moment (a completed backup, not a random screen mount) —
   * both platforms already throttle how often the dialog can actually appear
   * regardless, so this is "ask if it's a good time", not a guarantee it
   * shows.
   */
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

      // Mark as requested before calling out — the OS-level dialog can be
      // dismissed/interrupted, but we still only want to have *asked* once.
      await AsyncStorage.setItem(STORAGE_KEY_REVIEW_REQUESTED, String(Date.now()));
      await StoreReview.requestReview();
    } catch (e) {
      console.warn('[ReviewPromptService] maybeRequestReview failed:', e);
    }
  },
};
