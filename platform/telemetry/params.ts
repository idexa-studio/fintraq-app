/** GA4 limits: https://support.google.com/analytics/answer/9267744 */
const MAX_NAME_LENGTH = 40;
const MAX_PARAMS = 25;
const MAX_PARAM_VALUE_LENGTH = 100;
const MAX_SCREEN_NAME_LENGTH = 100;
const MAX_USER_PROPERTY_NAME_LENGTH = 24;
const MAX_USER_PROPERTY_VALUE_LENGTH = 36;
const MAX_ITEMS = 200;
const NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;
const RESERVED_PREFIXES = ['firebase_', 'google_', 'ga_'];

/** Logged automatically by the SDK; a manual event with one of these names is dropped and an error event logged instead. */
export const RESERVED_EVENT_NAMES: ReadonlySet<string> = new Set([
  'ad_activeview', 'ad_click', 'ad_exposure', 'ad_query', 'ad_reward', 'adunit_exposure', 'app_clear_data',
  'app_exception', 'app_remove', 'app_store_refund', 'app_store_subscription_cancel', 'app_store_subscription_convert',
  'app_store_subscription_renew', 'app_update', 'app_upgrade', 'dynamic_link_app_open', 'dynamic_link_app_update',
  'dynamic_link_first_open', 'error', 'firebase_campaign', 'first_open', 'first_visit', 'in_app_purchase',
  'notification_dismiss', 'notification_foreground', 'notification_open', 'notification_receive', 'os_update',
  'session_start', 'session_start_with_rollout', 'user_engagement',
]);

/** Set by the SDK itself. */
const RESERVED_USER_PROPERTIES: ReadonlySet<string> = new Set([
  'first_open_after_install', 'first_open_time', 'first_visit_time', 'last_deep_link_referrer', 'user_id',
]);

export type ItemParam = Record<string, string | number>;
export type EventParamValue = string | number | ItemParam[];

/** A name GA4 will accept for a parameter: letters, digits, underscores, starting with a letter, ≤40 chars, no reserved prefix. */
export function isValidAnalyticsName(name: string): boolean {
  return name.length <= MAX_NAME_LENGTH && NAME_PATTERN.test(name) && !RESERVED_PREFIXES.some((p) => name.startsWith(p));
}

/** A valid name that the SDK doesn't reserve for its own automatic events. */
export function isValidEventName(name: string): boolean {
  return isValidAnalyticsName(name) && !RESERVED_EVENT_NAMES.has(name);
}

/**
 * Drops what GA4 would reject or silently truncate: invalid keys, empty values, over-long strings,
 * params past the 25 limit. Returns undefined when nothing is left, so events log without a params object.
 */
export function sanitizeEventParams(params: Record<string, EventParamValue | null | undefined> | undefined): Record<string, EventParamValue> | undefined {
  if (!params) return undefined;
  const out: Record<string, EventParamValue> = {};
  let count = 0;
  for (const [key, value] of Object.entries(params)) {
    if (count >= MAX_PARAMS) break;
    if (value == null || !isValidAnalyticsName(key)) continue;
    if (typeof value === 'number' && !Number.isFinite(value)) continue;
    if (Array.isArray(value)) {
      // Only `items` may be an array (GA4 ecommerce); each item's params follow the same rules.
      if (key !== 'items') continue;
      const items = value.slice(0, MAX_ITEMS).map((item) => sanitizeEventParams(item)).filter((i): i is Record<string, string | number> => !!i);
      if (items.length === 0) continue;
      out[key] = items;
    } else {
      out[key] = typeof value === 'string' ? value.slice(0, MAX_PARAM_VALUE_LENGTH) : value;
    }
    count++;
  }
  return count > 0 ? out : undefined;
}

/**
 * Keeps only user properties GA4 will store: valid, non-reserved names of ≤24 chars and non-empty
 * values of ≤36 chars. Anything longer would be silently discarded by GA4, so drop it visibly here.
 */
export function sanitizeUserProperties(properties: Record<string, string | null | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(properties)) {
    if (!value || value.length > MAX_USER_PROPERTY_VALUE_LENGTH) continue;
    if (name.length > MAX_USER_PROPERTY_NAME_LENGTH || !isValidAnalyticsName(name) || RESERVED_USER_PROPERTIES.has(name)) continue;
    out[name] = value;
  }
  return out;
}

/** Bucket a count so a result size reads as a band, not an exact figure. */
export function resultBucket(count: number): '0' | '1-5' | '6-20' | '21+' {
  if (count <= 0) return '0';
  if (count <= 5) return '1-5';
  if (count <= 20) return '6-20';
  return '21+';
}

/**
 * The route *template* for a screen, from Expo Router segments: groups like `(main)` are dropped and
 * dynamic segments keep their placeholder, so `/accounts/42` and `/accounts/7` both report as
 * `accounts/[id]`. Using the concrete pathname instead would leak record IDs and explode the
 * number of distinct screen names in GA4.
 */
export function screenNameFromSegments(segments: readonly string[]): string {
  const parts = segments.filter((s) => s && !(s.startsWith('(') && s.endsWith(')')) && s !== 'index');
  const name = parts.join('/') || 'home';
  return name.slice(0, MAX_SCREEN_NAME_LENGTH);
}
