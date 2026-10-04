import { formatLockoutRemaining, PIN_FREE_ATTEMPTS, pinLockoutMs } from '@/src/features/lock/utils/pin-lockout';

describe('pinLockoutMs', () => {
  it('imposes no wait for the first slips', () => {
    for (let n = 0; n < PIN_FREE_ATTEMPTS; n++) expect(pinLockoutMs(n)).toBe(0);
  });

  it('starts at 30 s and doubles', () => {
    expect(pinLockoutMs(5)).toBe(30_000);
    expect(pinLockoutMs(6)).toBe(60_000);
    expect(pinLockoutMs(7)).toBe(120_000);
  });

  it('never exceeds 15 minutes', () => {
    expect(pinLockoutMs(50)).toBe(15 * 60_000);
  });
});

describe('formatLockoutRemaining', () => {
  it('formats as m:ss, rounding up', () => {
    expect(formatLockoutRemaining(29_100)).toBe('0:30');
    expect(formatLockoutRemaining(90_000)).toBe('1:30');
    expect(formatLockoutRemaining(-5)).toBe('0:00');
  });
});
