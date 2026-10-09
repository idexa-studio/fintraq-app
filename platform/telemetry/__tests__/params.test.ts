import type { AnalyticsEventName } from '@/platform/telemetry';
import { isValidAnalyticsName, isValidEventName, resultBucket, sanitizeEventParams, sanitizeUserProperties, screenNameFromSegments } from '@/platform/telemetry/params';

describe('screenNameFromSegments', () => {
  it('drops route groups and keeps dynamic placeholders instead of record ids', () => {
    expect(screenNameFromSegments(['(main)', 'accounts', '[id]'])).toBe('accounts/[id]');
    expect(screenNameFromSegments(['transactions', 'edit', '[id]'])).toBe('transactions/edit/[id]');
  });

  it('names the tab root and index routes', () => {
    expect(screenNameFromSegments(['(main)', '(tabs)'])).toBe('home');
    expect(screenNameFromSegments([])).toBe('home');
    expect(screenNameFromSegments(['(main)', '(tabs)', 'analytics'])).toBe('analytics');
    expect(screenNameFromSegments(['transactions', 'index'])).toBe('transactions');
  });
});

describe('sanitizeEventParams', () => {
  it('drops empty values, invalid or reserved keys and non-finite numbers', () => {
    expect(
      sanitizeEventParams({ ok: 'yes', count: 3, gone: undefined, nil: null, 'bad-key': 'x', firebase_x: 'x', nan: Number.NaN }),
    ).toEqual({ ok: 'yes', count: 3 });
  });

  it('truncates long strings to the GA4 limit and caps the param count at 25', () => {
    const many = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`p${i}`, 'a'.repeat(150)]));
    const out = sanitizeEventParams(many)!;
    expect(Object.keys(out)).toHaveLength(25);
    expect(out.p0).toHaveLength(100);
  });

  it('returns undefined when nothing survives', () => {
    expect(sanitizeEventParams(undefined)).toBeUndefined();
    expect(sanitizeEventParams({ a: undefined })).toBeUndefined();
  });
});

describe('isValidAnalyticsName', () => {
  it('accepts GA4-safe names only', () => {
    expect(isValidAnalyticsName('transaction_saved')).toBe(true);
    expect(isValidAnalyticsName('1st')).toBe(false);
    expect(isValidAnalyticsName('google_thing')).toBe(false);
    expect(isValidAnalyticsName('a'.repeat(41))).toBe(false);
  });
});

describe('resultBucket', () => {
  it('reports bands, not exact counts', () => {
    expect([0, 1, 5, 6, 20, 21, 500].map(resultBucket)).toEqual(['0', '1-5', '1-5', '6-20', '6-20', '21+', '21+']);
  });
});

describe('isValidEventName', () => {
  it('rejects names the SDK reserves for automatic events', () => {
    expect(isValidEventName('first_open')).toBe(false);
    expect(isValidEventName('in_app_purchase')).toBe(false);
    expect(isValidEventName('session_start')).toBe(false);
    expect(isValidEventName('transaction_saved')).toBe(true);
  });

  it('accepts every event in the catalogue', () => {
    const catalogue: Record<AnalyticsEventName, true> = {
      tutorial_begin: true, tutorial_complete: true, transaction_saved: true, account_saved: true, budget_saved: true, budget_warning: true, search_performed: true,
      paywall_view: true, begin_checkout: true, purchase_restore: true, backup_created: true, backup_restored: true, data_exported: true,
    };
    for (const name of Object.keys(catalogue)) expect(isValidEventName(name)).toBe(true);
  });
});

describe('sanitizeEventParams items', () => {
  it('keeps item arrays only under `items` and cleans each item', () => {
    expect(sanitizeEventParams({ items: [{ item_id: 'pro', bad: undefined as unknown as string }], other: [{ a: 1 }] })).toEqual({
      items: [{ item_id: 'pro' }],
    });
  });
});

describe('sanitizeUserProperties', () => {
  it('drops names over 24 chars, values over 36, empty values and SDK-reserved names', () => {
    expect(
      sanitizeUserProperties({
        is_pro: 'true',
        this_name_is_far_too_long_x: 'a',
        app_language: 'x'.repeat(37),
        default_currency: '',
        first_open_time: '1',
      }),
    ).toEqual({ is_pro: 'true' });
  });
});
