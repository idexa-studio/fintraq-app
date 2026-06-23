import { Platform } from 'react-native';

type FirebaseUserTraits = {
  isPremium?: boolean;
  theme?: 'system' | 'light' | 'dark';
  defaultCurrency?: string;
  hasProfileName?: boolean;
};

type FirebaseEventParams = Record<string, string | number | boolean | string[] | number[] | null | undefined>;

function toFirebaseValue(value: string | number | boolean | null | undefined) {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

async function getFirebaseModules() {
  if (Platform.OS === 'web') return null;

  const [analyticsModule, crashlyticsModule] = await Promise.all([
    import('@react-native-firebase/analytics'),
    import('@react-native-firebase/crashlytics'),
  ]);

  return { analyticsModule, crashlyticsModule };
}

export async function configureFirebaseTelemetry(enabled: boolean) {
  const modules = await getFirebaseModules();
  if (!modules) return;

  const analytics = modules.analyticsModule.getAnalytics();
  const crashlytics = modules.crashlyticsModule.getCrashlytics();

  await Promise.all([
    modules.analyticsModule.setAnalyticsCollectionEnabled(analytics, enabled),
    modules.crashlyticsModule.setCrashlyticsCollectionEnabled(crashlytics, enabled),
  ]);
}

export async function setFirebaseUserTraits(traits: FirebaseUserTraits) {
  const modules = await getFirebaseModules();
  if (!modules) return;

  const analytics = modules.analyticsModule.getAnalytics();
  const crashlytics = modules.crashlyticsModule.getCrashlytics();

  const entries = Object.entries(traits).filter(([, value]) => value != null);

  await Promise.all(
    entries.map(([key, value]) =>
      modules.analyticsModule.setUserProperty(analytics, key, toFirebaseValue(value))
    )
  );

  await modules.crashlyticsModule.setAttributes(
    crashlytics,
    entries.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = toFirebaseValue(value);
      return acc;
    }, {})
  );
}

export async function logFirebaseScreenView(pathname: string) {
  const modules = await getFirebaseModules();
  if (!modules) return;

  const analytics = modules.analyticsModule.getAnalytics();

  const screenName = pathname === '/' ? 'root' : pathname.replace(/[\/[\]]+/g, '_').replace(/^_+|_+$/g, '') || 'root';

  await modules.analyticsModule.logEvent(analytics, 'screen_view', {
    screen_name: screenName,
    screen_class: screenName,
  });
}

export async function logFirebaseEvent(name: string, params?: FirebaseEventParams) {
  const modules = await getFirebaseModules();
  if (!modules) return;

  const analytics = modules.analyticsModule.getAnalytics();

  const sanitizedParams = params
    ? Object.entries(params).reduce<Record<string, string | number | boolean | string[] | number[]>>((acc, [key, value]) => {
        if (value == null) return acc;
        acc[key] = value;
        return acc;
      }, {})
    : undefined;

  await modules.analyticsModule.logEvent(analytics, name, sanitizedParams);
}

export async function logFirebaseMessage(message: string) {
  const modules = await getFirebaseModules();
  if (!modules) return;

  const crashlytics = modules.crashlyticsModule.getCrashlytics();
  await modules.crashlyticsModule.log(crashlytics, message);
}

export async function recordFirebaseError(error: Error, context?: string) {
  const modules = await getFirebaseModules();
  if (!modules) return;

  const crashlytics = modules.crashlyticsModule.getCrashlytics();

  if (context) {
    await modules.crashlyticsModule.log(crashlytics, context);
  }
  await modules.crashlyticsModule.recordError(crashlytics, error);
}
