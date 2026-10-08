import { GRACE_PERIOD_MS, PIN_LENGTH, isCompletePin, pinAfter, pinSetupAfter, shouldLockAfter } from '@/features/lock/lock-rules';

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

  it('locks after more than a glance away, or an unknown time', () => {
    expect(shouldLockAfter(GRACE_PERIOD_MS)).toBe(false);
    expect(shouldLockAfter(GRACE_PERIOD_MS + 1)).toBe(true);
    expect(shouldLockAfter(null)).toBe(true);
  });

  it('asks for a new PIN twice', () => {
    const first = pinSetupAfter({ step: 'choose' }, '123456');
    expect(first).toEqual({ kind: 'next', setup: { step: 'confirm', first: '123456' } });
    expect(pinSetupAfter({ step: 'confirm', first: '123456' }, '123456')).toEqual({ kind: 'done', pin: '123456' });
  });

  it('starts again when the second entry differs', () => {
    expect(pinSetupAfter({ step: 'confirm', first: '123456' }, '654321')).toEqual({ kind: 'mismatch', setup: { step: 'choose' } });
  });
});
