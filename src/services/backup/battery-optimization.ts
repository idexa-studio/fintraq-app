import { Linking, Platform } from 'react-native';
import { applicationId } from 'expo-application';
import { LoggerService } from '../logger.service';

/**
 * Opens OS battery-optimization settings so the user can whitelist the app.
 * Uses generic settings-navigation intents only (no REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
 * special permission) — that direct-exemption dialog is Play-Console-restricted to narrow
 * categories (VoIP, device management) this app doesn't qualify for.
 * Never throws — falls through to a caller-provided last-resort callback instead of crashing.
 */
export async function openBatteryOptimizationSettings(onAllIntentsFailed?: () => void): Promise<void> {
  if (Platform.OS !== 'android') {
    await openAppSettings();
    return;
  }

  try {
    await Linking.sendIntent('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
    return;
  } catch (e) {
    LoggerService.info('BATTERY_OPT', 'IGNORE_BATTERY_OPTIMIZATION_SETTINGS unavailable, trying app details', e);
  }

  try {
    await Linking.sendIntent('android.settings.APPLICATION_DETAILS_SETTINGS', [
      { key: 'android.provider.extra.APP_PACKAGE', value: applicationId ?? '' },
    ]);
    return;
  } catch (e) {
    LoggerService.warn('BATTERY_OPT', 'APPLICATION_DETAILS_SETTINGS intent failed', e);
  }

  onAllIntentsFailed?.();
}

/** Opens the app's own OS settings page (notification toggle, iOS Background App Refresh, etc). */
export async function openAppSettings(onFailed?: () => void): Promise<void> {
  try {
    await Linking.openSettings();
  } catch (e) {
    LoggerService.warn('BATTERY_OPT', 'Linking.openSettings failed', e);
    onFailed?.();
  }
}
