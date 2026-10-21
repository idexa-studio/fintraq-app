import { LoggerService } from '@/shared/logging/logger';
import * as Application from 'expo-application';
import { Linking, Platform } from 'react-native';

/** This app's id in the stores (`me.nafish.luno`), read from the app itself. */
const APP_ID = Application.applicationId ?? 'me.nafish.luno';

/**
 * Where Fintraq's page is, tried in order. On Android the Play Store app first, then its web page.
 * On iOS there is no App Store listing yet (phase L): the App Store itself, until its id is known.
 * Built into the app rather than read from the remote settings: a link that never changes cannot
 * then be mistyped in the console. (`forceUpdateConfig` still carries `storeUrl*` for 2.0.x installs.)
 */
const STORE_LINKS = Platform.OS === 'ios'
  ? ['https://apps.apple.com']
  : [`market://details?id=${APP_ID}`, `https://play.google.com/store/apps/details?id=${APP_ID}`];

/** Opens Fintraq's page in this platform's store. */
export async function openStore(): Promise<void> {
  for (const link of STORE_LINKS) {
    try {
      await Linking.openURL(link);
      return;
    } catch (e) {
      // No store app to take it: try the next way.
      LoggerService.warn('UPDATE', `Could not open ${link}`, e);
    }
  }
}
