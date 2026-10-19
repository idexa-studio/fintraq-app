import { Platform } from 'react-native';
import { readLatest } from '@/platform/config/update-rules';
import type { LatestVersion, LatestVersionConfig } from '@/platform/config/update-rules';
import { getAppBuildNumber } from '@/platform/config/version';
import { LoggerService } from '@/shared/logging/logger';

// ─── Schema Types ─────────────────────────────────────────────────────────────

export interface ForceUpdateConfig {
  androidMinBuild: number;
  androidVersionName: string;
  iosMinBuild: number;
  iosVersionName: string;
  // `storeUrlAndroid` and `storeUrlIos` are still in the console for 2.0.x installs, which open the
  // store with them. This build does not read them: the store link is built in (`openStore`).
}

export interface PlatformUrlConfig {
  androidUrl: string;
  iosUrl: string;
}

// ─── Derived App State ────────────────────────────────────────────────────────

export interface RemoteAppConfig {
  forceUpdate: {
    required: boolean;
    versionName: string;
  };
  /** The newest release on this platform's store, as announced in `latestVersionConfig`; null when none is. */
  latest: LatestVersion | null;
  privacyUrl: string;
  termsUrl: string;
}

// ─── Defaults (mirror Firebase console defaultValues) ────────────────────────

const DEFAULT_FORCE_UPDATE: ForceUpdateConfig = {
  androidMinBuild: 0,
  androidVersionName: '1.0.0',
  iosMinBuild: 0,
  iosVersionName: '1.0.0',
};

const DEFAULT_PRIVACY_URL_CONFIG: PlatformUrlConfig = {
  androidUrl: '',
  iosUrl: '',
};

const DEFAULT_TERMS_URL_CONFIG: PlatformUrlConfig = {
  androidUrl: '',
  iosUrl: '',
};

/** Nothing announced: no offer is made until the console says which release is newest. */
const DEFAULT_LATEST_VERSION: LatestVersionConfig = {
  android: { build: 0, version: '' },
  ios: { build: 0, version: '' },
};

const RC_DEFAULTS: Record<string, string> = {
  forceUpdateConfig: JSON.stringify(DEFAULT_FORCE_UPDATE),
  latestVersionConfig: JSON.stringify(DEFAULT_LATEST_VERSION),
  privacyUrlConfig: JSON.stringify(DEFAULT_PRIVACY_URL_CONFIG),
  termsUrlConfig: JSON.stringify(DEFAULT_TERMS_URL_CONFIG),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function deriveConfig(
  forceUpdate: ForceUpdateConfig,
  latestVersion: LatestVersionConfig | null,
  privacyUrlConfig: PlatformUrlConfig,
  termsUrlConfig: PlatformUrlConfig,
): RemoteAppConfig {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const currentBuild = getAppBuildNumber();

  const minBuild = platform === 'ios' ? forceUpdate.iosMinBuild : forceUpdate.androidMinBuild;
  const versionName = platform === 'ios' ? forceUpdate.iosVersionName : forceUpdate.androidVersionName;

  const forceRequired = minBuild > 0 && currentBuild > 0 && currentBuild < minBuild;

  const privacyUrl = platform === 'ios' ? privacyUrlConfig.iosUrl : privacyUrlConfig.androidUrl;
  const termsUrl = platform === 'ios' ? termsUrlConfig.iosUrl : termsUrlConfig.androidUrl;

  return {
    forceUpdate: { required: forceRequired, versionName },
    latest: readLatest(latestVersion, platform),
    privacyUrl,
    termsUrl,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function initRemoteConfig(): Promise<void> {
  const { getRemoteConfig } = await import('@react-native-firebase/remote-config');
  const rc = getRemoteConfig();

  rc.settings.minimumFetchIntervalMillis = __DEV__ ? 0 : 3_600_000;
  rc.settings.fetchTimeoutMillis = 15_000;
  rc.defaultConfig = RC_DEFAULTS;
}

export async function fetchRemoteAppConfig(): Promise<RemoteAppConfig> {
  const { getRemoteConfig, fetchAndActivate, getValue } = await import(
    '@react-native-firebase/remote-config'
  );

  const rc = getRemoteConfig();
  await fetchAndActivate(rc);

  const forceUpdate = safeParse<ForceUpdateConfig>(
    getValue(rc, 'forceUpdateConfig').asString(),
    DEFAULT_FORCE_UPDATE,
  );
  const latestVersion = safeParse<LatestVersionConfig | null>(
    getValue(rc, 'latestVersionConfig').asString(),
    DEFAULT_LATEST_VERSION,
  );
  const privacyUrlConfig = safeParse<PlatformUrlConfig>(
    getValue(rc, 'privacyUrlConfig').asString(),
    DEFAULT_PRIVACY_URL_CONFIG,
  );
  const termsUrlConfig = safeParse<PlatformUrlConfig>(
    getValue(rc, 'termsUrlConfig').asString(),
    DEFAULT_TERMS_URL_CONFIG,
  );

  if (__DEV__) {
    LoggerService.info('REMOTE_CONFIG', 'Force-update config', JSON.stringify(forceUpdate));
    LoggerService.info('REMOTE_CONFIG', 'Latest-version config', JSON.stringify(latestVersion));
    LoggerService.info('REMOTE_CONFIG', `Current build ${getAppBuildNumber()} on ${Platform.OS}`);
    const result = deriveConfig(forceUpdate, latestVersion, privacyUrlConfig, termsUrlConfig);
    LoggerService.info('REMOTE_CONFIG', `Derived forceUpdateRequired: ${result.forceUpdate.required}`);
    return result;
  }

  return deriveConfig(forceUpdate, latestVersion, privacyUrlConfig, termsUrlConfig);
}
