import { SETUP_STEPS, newSetupDraft, nextStep, openingBalance, previousStep, setupBlockerOf, withAccountName, withKind } from '@/features/onboarding/first-run-rules';

const draft = () => newSetupDraft('USD', 'Cash');

describe('first-run rules', () => {
  it('asks for a name, a currency and a first account, in that order', () => {
    expect(SETUP_STEPS).toEqual(['name', 'currency', 'account']);
    expect(nextStep('name')).toBe('currency');
    expect(nextStep('account')).toBeNull();
    expect(previousStep('name')).toBeNull();
    expect(previousStep('account')).toBe('currency');
  });

  it('starts with a cash account named after its kind and nothing in it', () => {
    expect(draft()).toMatchObject({ kind: 'cash', accountName: 'Cash', balance: '', currency: 'USD' });
  });

  it('needs a name before the first step can be left', () => {
    expect(setupBlockerOf('name', draft())).toBe('name');
    expect(setupBlockerOf('name', { ...draft(), name: '  ' })).toBe('name');
    expect(setupBlockerOf('name', { ...draft(), name: 'John' })).toBeNull();
  });

  it('never blocks the currency step: one is always chosen', () => {
    expect(setupBlockerOf('currency', draft())).toBeNull();
  });

  it('names the account after its kind until the user names it', () => {
    expect(withKind(draft(), 'bank', 'Bank account').accountName).toBe('Bank account');
    const named = withAccountName(draft(), 'Monzo');
    expect(withKind(named, 'bank', 'Bank account')).toMatchObject({ kind: 'bank', accountName: 'Monzo' });
  });

  it('reads an opening balance: nothing is zero, nonsense is refused', () => {
    expect(openingBalance('')).toBe(0);
    expect(openingBalance('1,250.50')).toBe(1250.5);
    expect(openingBalance('abc')).toBeNull();
  });

  it('needs an account name and a readable balance to finish', () => {
    expect(setupBlockerOf('account', { ...draft(), accountName: ' ' })).toBe('accountName');
    expect(setupBlockerOf('account', { ...draft(), balance: 'abc' })).toBe('balance');
    expect(setupBlockerOf('account', { ...draft(), balance: '500' })).toBeNull();
    expect(setupBlockerOf('account', draft())).toBeNull();
  });
});
