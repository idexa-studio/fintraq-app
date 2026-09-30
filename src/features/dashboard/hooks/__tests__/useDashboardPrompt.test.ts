import { chooseDashboardPrompt, DashboardPromptInput } from '@/src/features/dashboard/hooks/useDashboardPrompt';

jest.mock('@/src/features/backup/hooks/useBackupAccount', () => ({ useBackupAccount: jest.fn() }));
jest.mock('@/src/providers/AppLockProvider', () => ({ useAppLock: jest.fn() }));
jest.mock('@/src/providers/PremiumProvider', () => ({ usePremium: jest.fn() }));

const base: DashboardPromptInput = {
  isResolved: true,
  isLocked: false,
  isPremium: false,
  isBackupConnected: false,
  transactionCount: 5,
};

describe('chooseDashboardPrompt', () => {
  it('offers Pro to engaged free users — never the backup prompt they cannot complete', () => {
    expect(chooseDashboardPrompt(base)).toBe('upsell');
  });

  it('offers backup to Pro users without a connected Drive', () => {
    expect(chooseDashboardPrompt({ ...base, isPremium: true })).toBe('backup');
  });

  it('shows nothing to Pro users who are already backed up', () => {
    expect(chooseDashboardPrompt({ ...base, isPremium: true, isBackupConnected: true })).toBeNull();
  });

  it('waits for entitlement to resolve so Pro users never see a flash of the upsell', () => {
    expect(chooseDashboardPrompt({ ...base, isResolved: false })).toBeNull();
  });

  it('stays quiet behind the app lock and on a near-empty dashboard', () => {
    expect(chooseDashboardPrompt({ ...base, isLocked: true })).toBeNull();
    expect(chooseDashboardPrompt({ ...base, transactionCount: 2 })).toBeNull();
  });
});
