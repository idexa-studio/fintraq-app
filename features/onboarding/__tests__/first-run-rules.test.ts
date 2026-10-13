import { newSetupDraft, openingBalance, setupBlockerOf, withAccountName, withKind } from '@/features/onboarding/first-run-rules';

const draft = () => newSetupDraft('USD', 'Cash');
const named = () => ({ ...draft(), name: 'John' });

describe('first-run rules', () => {
  it('starts with a cash account named after its kind and nothing in it', () => {
    expect(draft()).toMatchObject({ kind: 'cash', accountName: 'Cash', balance: '', currency: 'USD' });
  });

  it('needs a name first', () => {
    expect(setupBlockerOf(draft())).toBe('name');
    expect(setupBlockerOf({ ...draft(), name: '  ' })).toBe('name');
    expect(setupBlockerOf(named())).toBeNull();
  });

  it('then an account name and a readable balance', () => {
    expect(setupBlockerOf({ ...named(), accountName: ' ' })).toBe('accountName');
    expect(setupBlockerOf({ ...named(), balance: 'abc' })).toBe('balance');
    expect(setupBlockerOf({ ...named(), balance: '500' })).toBeNull();
  });

  it('names the account after its kind until the user names it', () => {
    expect(withKind(draft(), 'bank', 'Bank account').accountName).toBe('Bank account');
    const own = withAccountName(draft(), 'Monzo');
    expect(withKind(own, 'bank', 'Bank account')).toMatchObject({ kind: 'bank', accountName: 'Monzo' });
  });

  it('reads an opening balance: nothing is zero, nonsense is refused', () => {
    expect(openingBalance('')).toBe(0);
    expect(openingBalance('1,250.50')).toBe(1250.5);
    expect(openingBalance('abc')).toBeNull();
  });
});
