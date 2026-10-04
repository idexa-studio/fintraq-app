import { getFirebaseModules } from './firebase-modules';

/** Same contract as Analytics: fire-and-forget, never throws into the caller. */
export const Crashlytics = {
  /** Follows the same user choice as analytics; debug builds never report. */
  setEnabled(userAllowed: boolean): void {
    getFirebaseModules()
      .then((m) => m && m.crashlytics.setCrashlyticsCollectionEnabled(m.crashlytics.getCrashlytics(), userAllowed && !__DEV__))
      .catch(() => {});
  },

  /** A non-fatal error, with an optional breadcrumb naming where it was caught. */
  recordError(error: Error, context?: string): void {
    getFirebaseModules()
      .then(async (m) => {
        if (!m) return;
        const instance = m.crashlytics.getCrashlytics();
        if (context) await m.crashlytics.log(instance, context);
        await m.crashlytics.recordError(instance, error);
      })
      .catch(() => {});
  },
};
