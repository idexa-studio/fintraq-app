import type * as AnalyticsModule from '@/src/services/telemetry/analytics';

const mockLogEvent = jest.fn();
const mockSetConsent = jest.fn(() => Promise.resolve());
const mockSetCollection = jest.fn(() => Promise.resolve());

jest.mock('@react-native-firebase/analytics', () => ({
  getAnalytics: () => ({}),
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
  setConsent: (...args: unknown[]) => mockSetConsent(...(args as [])),
  setAnalyticsCollectionEnabled: (...args: unknown[]) => mockSetCollection(...(args as [])),
  setUserProperties: jest.fn(() => Promise.resolve()),
}));
jest.mock('@react-native-firebase/crashlytics', () => ({}));


const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

// The consent gate is module-level state: load a fresh copy per test.
function load(): typeof AnalyticsModule.Analytics {
  let mod!: typeof AnalyticsModule;
  jest.isolateModules(() => {
    mod = jest.requireActual<typeof AnalyticsModule>('@/src/services/telemetry/analytics');
  });
  return mod.Analytics;
}

describe('Analytics', () => {
  const globalWithDev = global as unknown as { __DEV__: boolean };
  const originalDev = globalWithDev.__DEV__;

  beforeEach(() => {
    jest.clearAllMocks();
    globalWithDev.__DEV__ = false; // behave like a release build
  });
  afterAll(() => {
    globalWithDev.__DEV__ = originalDev;
  });

  it('holds events fired before consent is applied, then sends them once allowed', async () => {
    const Analytics = load();
    Analytics.track('tutorial_begin');
    await flush();
    expect(mockLogEvent).not.toHaveBeenCalled();

    Analytics.setEnabled(true);
    await flush();
    expect(mockLogEvent).toHaveBeenCalledWith(expect.anything(), 'tutorial_begin', undefined);
  });

  it('drops events when the user opted out', async () => {
    const Analytics = load();
    Analytics.track('backup_restored');
    Analytics.setEnabled(false);
    Analytics.track('transaction_saved', { transaction_type: 'expense', mode: 'create' });
    await flush();
    expect(mockLogEvent).not.toHaveBeenCalled();
    expect(mockSetCollection).toHaveBeenCalledWith(expect.anything(), false);
  });

  it('always denies ad consent and grants analytics storage only when allowed', async () => {
    const Analytics = load();
    Analytics.setEnabled(true);
    await flush();
    expect(mockSetConsent).toHaveBeenCalledWith(expect.anything(), {
      analytics_storage: true,
      ad_storage: false,
      ad_user_data: false,
      ad_personalization: false,
    });
  });

  it('never sends from debug builds', async () => {
    globalWithDev.__DEV__ = true;
    const Analytics = load();
    Analytics.setEnabled(true);
    Analytics.screen('home');
    await flush();
    expect(mockLogEvent).not.toHaveBeenCalled();
    expect(mockSetCollection).toHaveBeenCalledWith(expect.anything(), false);
  });

  it('logs screen views as screen_view with the template name', async () => {
    const Analytics = load();
    Analytics.setEnabled(true);
    Analytics.screen('accounts/[id]');
    await flush();
    expect(mockLogEvent).toHaveBeenCalledWith(expect.anything(), 'screen_view', { screen_name: 'accounts/[id]', screen_class: 'accounts/[id]' });
  });

  it('never throws into the caller when the SDK fails', async () => {
    mockLogEvent.mockImplementationOnce(() => {
      throw new Error('native down');
    });
    const Analytics = load();
    Analytics.setEnabled(true);
    expect(() => Analytics.track('search', { results: '0' })).not.toThrow();
    await flush();
  });
});
