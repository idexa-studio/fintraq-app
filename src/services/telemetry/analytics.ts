import { LoggerService } from '@/src/services/logger.service';
import type { AnalyticsEventName, AnalyticsEvents, AnalyticsUserProperties } from './events';
import { getFirebaseModules } from './firebase-modules';
import { type EventParamValue, isValidEventName, sanitizeEventParams, sanitizeUserProperties } from './params';

/** Debug builds send nothing unless EXPO_PUBLIC_ANALYTICS_DEBUG=1 (then use GA4 DebugView to watch events). */
const DEV_ENABLED = process.env.EXPO_PUBLIC_ANALYTICS_DEBUG === '1';

/**
 * Resolves to whether collection is on, once the provider has applied the user's choice. Events
 * wait on it: a screen's mount effect runs before the provider's effect (children first), and
 * native collection starts off (firebase.json) on a fresh install, so without this gate the first
 * screen view and `tutorial_begin` would be dropped. Opted-out events are dropped here in JS too.
 */
let resolveFirstChoice: (enabled: boolean) => void;
let collection: Promise<boolean> = new Promise((resolve) => {
  resolveFirstChoice = resolve;
});
let choiceApplied = false;

/**
 * Telemetry must never affect the app: a failure is logged in dev and otherwise swallowed. Every
 * public method is fire-and-forget (returns void) so callers can't await it on a save or purchase path.
 */
function run(label: string, task: (m: NonNullable<Awaited<ReturnType<typeof getFirebaseModules>>>) => Promise<unknown>): void {
  collection
    .then((enabled) => (enabled ? getFirebaseModules() : null))
    .then((m) => (m ? task(m) : undefined))
    .catch((e) => {
      if (__DEV__) LoggerService.warn('ANALYTICS', `${label} failed`, e);
    });
}

type FirebaseAnalytics = NonNullable<Awaited<ReturnType<typeof getFirebaseModules>>>['analytics'];

/**
 * The SDK's logEvent overloads tie GA4 recommended names to their own param shapes (e.g. `search`
 * requires `search_term`, which we never send) and the call itself returns void. Our catalogue in
 * events.ts is the type check, so call it through its untyped fallback signature.
 */
function logEvent(analytics: FirebaseAnalytics, name: string, params?: Record<string, EventParamValue>): void {
  (analytics.logEvent as (instance: ReturnType<FirebaseAnalytics['getAnalytics']>, name: string, params?: Record<string, EventParamValue>) => void)(
    analytics.getAnalytics(),
    name,
    params,
  );
}

type ParamsArg<E extends AnalyticsEventName> = AnalyticsEvents[E] extends undefined ? [] : [params: AnalyticsEvents[E]];

export const Analytics = {
  /**
   * Turns collection on or off for this install, persisted natively across launches. Consent for
   * ad storage, ad user data and ad personalisation is always denied: the app shows no ads.
   */
  setEnabled(userAllowed: boolean): void {
    const enabled = userAllowed && (!__DEV__ || DEV_ENABLED);
    const applied = getFirebaseModules()
      .then(async (m) => {
        if (!m) return false;
        const instance = m.analytics.getAnalytics();
        await m.analytics.setConsent(instance, {
          analytics_storage: enabled,
          ad_storage: false,
          ad_user_data: false,
          ad_personalization: false,
        });
        await m.analytics.setAnalyticsCollectionEnabled(instance, enabled);
        return enabled;
      })
      .catch((e) => {
        if (__DEV__) LoggerService.warn('ANALYTICS', 'setEnabled failed', e);
        return false;
      });
    // Events already queued on the first, pending gate are released when this first choice lands.
    if (!choiceApplied) void applied.then(resolveFirstChoice);
    choiceApplied = true;
    collection = applied;
  },

  track<E extends AnalyticsEventName>(name: E, ...[params]: ParamsArg<E>): void {
    if (!isValidEventName(name)) {
      if (__DEV__) LoggerService.warn('ANALYTICS', `Invalid or reserved event name: ${name}`);
      return;
    }
    run(`track ${name}`, async ({ analytics }) => logEvent(analytics, name, sanitizeEventParams(params as Record<string, EventParamValue> | undefined)));
  },

  /** Screen names are route templates (see screenNameFromSegments); automatic screen reporting is off in firebase.json. */
  screen(screenName: string): void {
    // logEvent('screen_view') is the current API; logScreenView is deprecated in the SDK.
    run('screen', async ({ analytics }) => logEvent(analytics, 'screen_view', { screen_name: screenName, screen_class: screenName }));
  },

  setUserProperties(properties: Partial<AnalyticsUserProperties>): void {
    const valid = sanitizeUserProperties(properties);
    if (Object.keys(valid).length === 0) return;
    run('setUserProperties', ({ analytics }) => analytics.setUserProperties(analytics.getAnalytics(), valid));
  },
};
