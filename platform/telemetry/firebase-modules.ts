export type FirebaseModules = {
  analytics: typeof import('@react-native-firebase/analytics');
  crashlytics: typeof import('@react-native-firebase/crashlytics');
};

/**
 * Web (the preview build) has no native Firebase, so every telemetry call is a no-op there.
 * iOS and Android resolve firebase-modules.native.ts, which imports the SDK statically.
 */
export function getFirebaseModules(): Promise<FirebaseModules | null> {
  return Promise.resolve(null);
}
