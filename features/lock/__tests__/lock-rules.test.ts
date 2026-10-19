import { GRACE_PERIOD_MS, PIN_LENGTH, hasLeftTheApp, isCompletePin, pinAfter, pinSetupAfter, shouldLockOnReturn } from '@/features/lock/lock-rules';

describe('lock rules', () => {
  it('adds digits up to six and removes the last', () => {
    expect(pinAfter('12', '3')).toBe('123');
    expect(pinAfter('123', 'delete')).toBe('12');
    expect(pinAfter('', 'delete')).toBe('');
    expect(pinAfter('123456', '7')).toBe('123456');
    expect(PIN_LENGTH).toBe(6);
  });

  it('ignores keys that are not digits', () => {
    expect(pinAfter('12', '.')).toBe('12');
    expect(pinAfter('12', '+')).toBe('12');
  });

  it('knows a full PIN', () => {
    expect(isCompletePin('12345')).toBe(false);
    expect(isCompletePin('123456')).toBe(true);
  });

  it('locks again after more than a glance away', () => {
    const now = 1_000_000;
    expect(shouldLockOnReturn(now - GRACE_PERIOD_MS, now)).toBe(false);
    expect(shouldLockOnReturn(now - GRACE_PERIOD_MS - 1, now)).toBe(true);
  });

  it('never locks again on becoming active without having left, as when the Face ID sheet closes', () => {
    expect(shouldLockOnReturn(null, 1_000_000)).toBe(false);
  });

  it('asks for a new PIN twice', () => {
    const first = pinSetupAfter({ step: 'choose' }, '123456');
    expect(first).toEqual({ kind: 'next', setup: { step: 'confirm', first: '123456' } });
    expect(pinSetupAfter({ step: 'confirm', first: '123456' }, '123456')).toEqual({ kind: 'done', pin: '123456' });
  });

  it('starts again when the second entry differs', () => {
    expect(pinSetupAfter({ step: 'confirm', first: '123456' }, '654321')).toEqual({ kind: 'mismatch', setup: { step: 'choose' } });
  });

  it('counts only going to the background as leaving, not being covered by Face ID or Control Centre', () => {
    expect(hasLeftTheApp('background')).toBe(true);
    expect(hasLeftTheApp('inactive')).toBe(false);
    expect(hasLeftTheApp('active')).toBe(false);
  });
});
