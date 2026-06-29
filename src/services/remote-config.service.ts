import { Platform } from 'react-native';
import { getAppBuildNumber } from '@/src/utils/version';

// ─── Schema Types ─────────────────────────────────────────────────────────────

export interface ForceUpdateConfig {
  androidMinBuild: number;
  androidVersionName: string;
  iosMinBuild: number;
  iosVersionName: string;
  storeUrlAndroid: string;
  storeUrlIos: string;
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
    storeUrl: string;
  };
  privacyUrl: string;
  termsUrl: string;
}

// ─── Defaults (mirror Firebase console defaultValues) ────────────────────────

const DEFAULT_FORCE_UPDATE: ForceUpdateConfig = {
  androidMinBuild: 0,
  androidVersionName: '1.0.0',
  iosMinBuild: 0,
  iosVersionName: '1.0.0',
  storeUrlAndroid: 'https://play.google.com/store',
  storeUrlIos: 'https://apps.apple.com',
};

const DEFAULT_PRIVACY_URL_CONFIG: PlatformUrlConfig = {
  androidUrl: '',
  iosUrl: '',
};

const DEFAULT_TERMS_URL_CONFIG: PlatformUrlConfig = {
  androidUrl: '',
  iosUrl: '',
};

const RC_DEFAULTS: Record<string, string> = {
  forceUpdateConfig: JSON.stringify(DEFAULT_FORCE_UPDATE),
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
  privacyUrlConfig: PlatformUrlConfig,
  termsUrlConfig: PlatformUrlConfig,
): RemoteAppConfig {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const currentBuild = getAppBuildNumber();

  const minBuild = platform === 'ios' ? forceUpdate.iosMinBuild : forceUpdate.androidMinBuild;
  const versionName = platform === 'ios' ? forceUpdate.iosVersionName : forceUpdate.androidVersionName;
  const storeUrl = platform === 'ios' ? forceUpdate.storeUrlIos : forceUpdate.storeUrlAndroid;

  const forceRequired = minBuild > 0 && currentBuild > 0 && currentBuild < minBuild;

  const privacyUrl = platform === 'ios' ? privacyUrlConfig.iosUrl : privacyUrlConfig.androidUrl;
  const termsUrl = platform === 'ios' ? termsUrlConfig.iosUrl : termsUrlConfig.androidUrl;

  return {
    forceUpdate: { required: forceRequired, versionName, storeUrl },
    privacyUrl,
    termsUrl,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function initRemoteConfig(): Promise<void> {
  const { getRemoteConfig } = await import('@react-native-firebase/remote-config');
  const rc = getRemoteConfig();

  rc.settings.minimumFetchIntervalMillis = __DEV__ ? 0 : 3_600_000;
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
  const privacyUrlConfig = safeParse<PlatformUrlConfig>(
    getValue(rc, 'privacyUrlConfig').asString(),
    DEFAULT_PRIVACY_URL_CONFIG,
  );
  const termsUrlConfig = safeParse<PlatformUrlConfig>(
    getValue(rc, 'termsUrlConfig').asString(),
    DEFAULT_TERMS_URL_CONFIG,
  );

  if (__DEV__) {
    console.log('[RC] forceUpdateConfig:', JSON.stringify(forceUpdate));
    console.log('[RC] currentBuild:', getAppBuildNumber(), '| platform:', Platform.OS);
    const result = deriveConfig(forceUpdate, privacyUrlConfig, termsUrlConfig);
    console.log('[RC] derived → forceUpdateRequired:', result.forceUpdate.required);
    return result;
  }

  return deriveConfig(forceUpdate, privacyUrlConfig, termsUrlConfig);
}
