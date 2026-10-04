import { isValidAnalyticsName, resultBucket, sanitizeEventParams, screenNameFromSegments } from '@/src/services/telemetry/params';

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
