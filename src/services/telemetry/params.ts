/** GA4 limits: https://support.google.com/analytics/answer/9267744 */
const MAX_NAME_LENGTH = 40;
const MAX_PARAMS = 25;
const MAX_PARAM_VALUE_LENGTH = 100;
const MAX_SCREEN_NAME_LENGTH = 100;
const NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;
const RESERVED_PREFIXES = ['firebase_', 'google_', 'ga_'];

export type EventParamValue = string | number;

/** A name GA4 will accept for an event or a parameter: letters, digits, underscores, starting with a letter, not reserved. */
export function isValidAnalyticsName(name: string): boolean {
  return name.length <= MAX_NAME_LENGTH && NAME_PATTERN.test(name) && !RESERVED_PREFIXES.some((p) => name.startsWith(p));
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
    out[key] = typeof value === 'string' ? value.slice(0, MAX_PARAM_VALUE_LENGTH) : value;
    count++;
  }
  return count > 0 ? out : undefined;
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
