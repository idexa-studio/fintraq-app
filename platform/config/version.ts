import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Returns the app's version name (e.g. "1.1.5").
 */
export function getAppVersion(): string {
  return Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '1.0.0';
}

/**
 * Resolves the current build number of the app.
 * Utilizes native build version (essential for EAS auto-bumping) with app.json fallback.
 */
export function getAppBuildNumber(): number {
  // 1. Try to read from native package metadata (critical for EAS auto-bumping standalone/dev builds)
  const nativeBuild = Application.nativeBuildVersion;
  if (nativeBuild) {
    const parsed = parseInt(nativeBuild, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // 2. Fallback to app.json configuration (for Expo Go environment)
  const build = Platform.select<string | number>({
    ios: Constants.expoConfig?.ios?.buildNumber,
    android: Constants.expoConfig?.android?.versionCode,
  });

  if (typeof build === 'number') {
    return build;
  }
  if (typeof build === 'string') {
    const parsed = parseInt(build, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

/**
 * Returns a formatted version string containing version name and build number (e.g., "1.1.5 (115)").
 */
export function getFormattedAppVersion(): string {
  const version = getAppVersion();
  const build = getAppBuildNumber();
  return `${version} (${build})`;
}
