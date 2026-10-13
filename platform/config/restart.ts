import { LoggerService } from '@/shared/logging/logger';
import * as Updates from 'expo-updates';
import { DevSettings } from 'react-native';

/**
 * Starts the app again from nothing, for when what it holds in memory no
 * longer matches what is stored (after a restore). Resolves false when it
 * could not, so the caller can say so instead of carrying on with stale state.
 */
export async function restartApp(): Promise<boolean> {
  try {
    await Updates.reloadAsync();
    return true;
  } catch (e) {
    LoggerService.warn('RESTART', 'Updates.reloadAsync failed', e);
  }
  // A development build has no update runtime to reload; its own reload does the same job.
  if (__DEV__ && DevSettings?.reload) {
    DevSettings.reload();
    return true;
  }
  return false;
}
