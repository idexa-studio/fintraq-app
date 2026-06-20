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

  const [{ default: analytics }, { default: crashlytics }] = await Promise.all([
    import('@react-native-firebase/analytics'),
    import('@react-native-firebase/crashlytics'),
  ]);

  return { analytics, crashlytics };
}

export async function configureFirebaseTelemetry(enabled: boolean) {
  const modules = await getFirebaseModules();
  if (!modules) return;

  await Promise.all([
    modules.analytics().setAnalyticsCollectionEnabled(enabled),
    modules.crashlytics().setCrashlyticsCollectionEnabled(enabled),
  ]);
}

export async function setFirebaseUserTraits(traits: FirebaseUserTraits) {
  const modules = await getFirebaseModules();
  if (!modules) return;

  const entries = Object.entries(traits).filter(([, value]) => value != null);

  await Promise.all(
    entries.map(([key, value]) => modules.analytics().setUserProperty(toFirebaseValue(value), key))
  );

  await modules.crashlytics().setAttributes(
    entries.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = toFirebaseValue(value);
      return acc;
    }, {})
  );
}

export async function logFirebaseScreenView(pathname: string) {
  const modules = await getFirebaseModules();
  if (!modules) return;

  const screenName = pathname === '/' ? 'root' : pathname.replace(/[\/[\]]+/g, '_').replace(/^_+|_+$/g, '') || 'root';

  await modules.analytics().logScreenView({
    screen_name: screenName,
    screen_class: screenName,
  });
}

export async function logFirebaseEvent(name: string, params?: FirebaseEventParams) {
  const modules = await getFirebaseModules();
  if (!modules) return;

  const sanitizedParams = params
    ? Object.entries(params).reduce<Record<string, string | number | boolean | string[] | number[]>>((acc, [key, value]) => {
        if (value == null) return acc;
        acc[key] = value;
        return acc;
      }, {})
    : undefined;

  await modules.analytics().logEvent(name, sanitizedParams);
}

export async function logFirebaseMessage(message: string) {
  const modules = await getFirebaseModules();
  if (!modules) return;

  modules.crashlytics().log(message);
}

export async function recordFirebaseError(error: Error, context?: string) {
  const modules = await getFirebaseModules();
  if (!modules) return;

  if (context) {
    modules.crashlytics().log(context);
  }
  modules.crashlytics().recordError(error);
}
